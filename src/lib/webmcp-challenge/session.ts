import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { ChallengeState } from './types';

export const CHALLENGE_SESSION_COOKIE = 'aimily_webmcp_challenge_session';
export const CHALLENGE_STATE_POINTER_COOKIE = 'aimily_webmcp_challenge_pointer';

export interface ChallengeSession {
  id: string;
  workspace: 'asteria-ss27';
  issuedAt: number;
  expiresAt: number;
}

function getSecret(): string {
  const secret = process.env.WEBMCP_CHALLENGE_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV !== 'production') return 'aimily-webmcp-challenge-local-only-secret';
  throw new Error('WEBMCP_CHALLENGE_SECRET is required in production.');
}

export function challengeStateFingerprint(token: string): string {
  return createHash('sha256').update(token).digest('base64url');
}

function signPayload<T>(payload: T): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', getSecret()).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyPayload<T>(token: string): T | null {
  const [body, signature, extra] = token.split('.');
  if (!body || !signature || extra) return null;
  const expected = createHmac('sha256', getSecret()).update(body).digest('base64url');
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

export function createChallengeSession(now = Date.now()): {
  session: ChallengeSession;
  token: string;
} {
  const session: ChallengeSession = {
    id: randomUUID(),
    workspace: 'asteria-ss27',
    issuedAt: now,
    expiresAt: now + 2 * 60 * 60 * 1_000,
  };
  return { session, token: signPayload(session) };
}

export function verifyChallengeSession(token: string | undefined, now = Date.now()): ChallengeSession | null {
  if (!token) return null;
  const session = verifyPayload<ChallengeSession>(token);
  if (!session || session.workspace !== 'asteria-ss27' || session.expiresAt <= now) return null;
  return session;
}

export function signChallengeState(state: ChallengeState): string {
  return signPayload(state);
}

export function verifyChallengeState(
  token: string | undefined,
  session: ChallengeSession,
): ChallengeState | null {
  if (!token) return null;
  const state = verifyPayload<ChallengeState>(token);
  if (!state || state.schemaVersion !== 1 || state.sessionId !== session.id) return null;
  return state;
}
