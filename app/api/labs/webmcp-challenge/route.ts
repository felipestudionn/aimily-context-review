import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DomainError } from '@/lib/domain/agent-world/contracts';
import { DraftCollectionRevisionArgsSchema } from '@/lib/domain/collection-creation/contracts';
import { buildCollectionRevisionBrief } from '@/lib/domain/collection-creation/brief';
import { buildCollectionRevisionImpact } from '@/lib/domain/collection-creation/impact';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { CHALLENGE_COLLECTION, CHALLENGE_CONTEXT } from '@/lib/webmcp-challenge/demo';
import {
  applyChallengePreview,
  approveChallengeRevision,
  createInitialChallengeState,
  draftChallengeRevision,
  undoChallengePreview,
  verifyChallengeReceiptChain,
} from '@/lib/webmcp-challenge/lifecycle';
import {
  CHALLENGE_SESSION_COOKIE,
  CHALLENGE_STATE_POINTER_COOKIE,
  challengeStateFingerprint,
  createChallengeSession,
  signChallengeState,
  verifyChallengeSession,
  verifyChallengeState,
} from '@/lib/webmcp-challenge/session';

export const runtime = 'nodejs';

const ChallengeDraftArgsSchema = DraftCollectionRevisionArgsSchema.strict();

const RequestSchema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.literal('bootstrap'),
    reset: z.boolean().default(false),
    stateToken: z.string().max(80_000).optional(),
  }).strict(),
  z.object({
    operation: z.literal('get_context'),
    stateToken: z.string().min(1).max(80_000),
  }).strict(),
  z.object({
    operation: z.literal('get_state'),
    stateToken: z.string().min(1).max(80_000),
  }).strict(),
  z.object({
    operation: z.literal('inspect_impact'),
    stateToken: z.string().min(1).max(80_000),
  }).strict(),
  z.object({
    operation: z.literal('get_approved_brief'),
    stateToken: z.string().min(1).max(80_000),
  }).strict(),
  z.object({
    operation: z.literal('draft_revision'),
    stateToken: z.string().min(1).max(80_000),
    args: ChallengeDraftArgsSchema,
  }).strict(),
  z.object({
    operation: z.literal('approve_revision'),
    stateToken: z.string().min(1).max(80_000),
    artifactHash: z.string().regex(/^[a-f0-9]{64}$/),
  }).strict(),
  z.object({
    operation: z.literal('apply_preview'),
    stateToken: z.string().min(1).max(80_000),
  }).strict(),
  z.object({
    operation: z.literal('undo_preview'),
    stateToken: z.string().min(1).max(80_000),
  }).strict(),
]);

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  const forwardedHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!forwardedHost) return false;
  try {
    return new URL(origin).host === forwardedHost;
  } catch {
    return false;
  }
}

function response(
  state: ReturnType<typeof createInitialChallengeState>,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  extra: Record<string, unknown> = {},
) {
  const receiptVerification = {
    ...verifyChallengeReceiptChain(state.receipts, state.revision?.hash ?? null),
    stateTokenStatus: 'server_hmac_signed_current_session' as const,
  };
  if (!receiptVerification.valid) {
    throw new Error('Challenge receipt integrity verification failed before state signing.');
  }
  const stateToken = signChallengeState(state);
  cookieStore.set(CHALLENGE_STATE_POINTER_COOKIE, challengeStateFingerprint(stateToken), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 2 * 60 * 60,
    path: '/',
  });
  return NextResponse.json(
    {
      ok: true,
      state,
      stateToken,
      receiptVerification,
      ...extra,
    },
    {
      headers: {
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    },
  );
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) {
    return NextResponse.json(
      { ok: false, code: 'FORBIDDEN', error: 'Cross-origin request rejected.' },
      { status: 403 },
    );
  }

  const ip = clientIp(req);
  if (!rateLimit.allow(`${ip}:webmcp-challenge`, 90, 60_000)) {
    return NextResponse.json(
      { ok: false, code: 'RATE_LIMITED', error: 'Too many demo operations. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': '30' } },
    );
  }

  let parsed: z.infer<typeof RequestSchema>;
  try {
    parsed = RequestSchema.parse(await req.json());
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        code: 'INVALID_INPUT',
        error: 'Invalid challenge operation.',
        details: error instanceof z.ZodError ? z.treeifyError(error) : undefined,
      },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const currentSessionToken = cookieStore.get(CHALLENGE_SESSION_COOKIE)?.value;
  const currentStatePointer = cookieStore.get(CHALLENGE_STATE_POINTER_COOKIE)?.value;

  try {
    if (parsed.operation === 'bootstrap') {
      const currentSession = parsed.reset ? null : verifyChallengeSession(currentSessionToken);
      const currentState = currentSession
        ? verifyChallengeState(parsed.stateToken, currentSession)
        : null;
      const currentTokenMatches = parsed.stateToken
        ? currentStatePointer === challengeStateFingerprint(parsed.stateToken)
        : false;
      if (currentSession && currentState && currentTokenMatches) {
        return response(currentState, cookieStore, { context: CHALLENGE_CONTEXT });
      }

      const { session, token } = createChallengeSession();
      cookieStore.set(CHALLENGE_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 2 * 60 * 60,
        path: '/',
      });
      return response(createInitialChallengeState(session.id), cookieStore, { context: CHALLENGE_CONTEXT });
    }

    const session = verifyChallengeSession(currentSessionToken);
    if (!session) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', error: 'The demo session expired. Start a new session.' },
        { status: 401 },
      );
    }
    const state = verifyChallengeState(parsed.stateToken, session);
    const isCurrentState = currentStatePointer === challengeStateFingerprint(parsed.stateToken);
    if (!state || !isCurrentState) {
      return NextResponse.json(
        { ok: false, code: 'CONFLICT', error: 'The signed demo state is invalid, stale or belongs to another session.' },
        { status: 409 },
      );
    }

    if (parsed.operation === 'get_context') {
      return response(state, cookieStore, { context: CHALLENGE_CONTEXT });
    }
    if (parsed.operation === 'get_state') return response(state, cookieStore);
    if (parsed.operation === 'inspect_impact') {
      if (!state.revision) {
        throw new DomainError('CONFLICT', 'Draft a collection revision before inspecting impact.', 409);
      }
      return response(state, cookieStore, { impact: buildCollectionRevisionImpact(state.revision) });
    }
    if (parsed.operation === 'get_approved_brief') {
      if (!state.revision || state.approval.status !== 'approved') {
        throw new DomainError('APPROVAL_REQUIRED', 'Approve the exact revision hash before generating its review brief.', 409);
      }
      const impact = buildCollectionRevisionImpact(state.revision);
      return response(state, cookieStore, {
        brief: buildCollectionRevisionBrief({
          collectionName: CHALLENGE_COLLECTION.name,
          season: CHALLENGE_COLLECTION.season,
          revision: state.revision,
          impact,
        }),
      });
    }

    const nextState = parsed.operation === 'draft_revision'
      ? draftChallengeRevision(state, parsed.args)
      : parsed.operation === 'approve_revision'
        ? approveChallengeRevision(state, parsed.artifactHash)
        : parsed.operation === 'apply_preview'
          ? applyChallengePreview(state)
          : undoChallengePreview(state);

    return response(nextState, cookieStore);
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json(
        { ok: false, code: error.code, error: error.message, details: error.details },
        { status: error.status, headers: { 'Cache-Control': 'private, no-store' } },
      );
    }
    console.error('[labs/webmcp-challenge]', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', error: 'Aimily could not complete the demo operation.' },
      { status: 500 },
    );
  }
}
