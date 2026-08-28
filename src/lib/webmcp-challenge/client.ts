'use client';

import type { CollectionRevisionImpact } from '@/lib/domain/collection-creation/impact';
import type { CollectionRevisionBrief } from '@/lib/domain/collection-creation/brief';
import type { ChallengeStateResponse } from './types';

const STATE_KEY = 'aimily:webmcp-challenge:state';

export interface ChallengeApiResponse extends ChallengeStateResponse {
  context?: Record<string, unknown>;
  impact?: CollectionRevisionImpact;
  brief?: CollectionRevisionBrief;
}

export type ChallengeOperationSurface = 'ui' | 'webmcp';

export function readChallengeStateToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STATE_KEY);
}

export async function callChallengeOperation(
  operation: string,
  payload: Record<string, unknown> = {},
  signal?: AbortSignal,
  surface: ChallengeOperationSurface = 'ui',
): Promise<ChallengeApiResponse> {
  const stateToken = readChallengeStateToken();
  const res = await fetch('/api/labs/webmcp-challenge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Aimily-Surface': surface,
      'X-Request-Id': crypto.randomUUID(),
    },
    body: JSON.stringify({
      operation,
      ...(stateToken ? { stateToken } : {}),
      ...payload,
    }),
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  });
  const body = await res.json() as ChallengeApiResponse & { error?: string };
  if (!res.ok || !body.ok) throw new Error(body.error ?? `Challenge operation failed (${res.status}).`);
  window.localStorage.setItem(STATE_KEY, body.stateToken);
  window.dispatchEvent(new CustomEvent('aimily:webmcp-challenge-state', {
    detail: {
      operation,
      surface,
      stage: body.state.stage,
      state: body.state,
      context: body.context,
      receiptVerification: body.receiptVerification,
    },
  }));
  return body;
}

export async function bootstrapChallenge(reset = false, signal?: AbortSignal): Promise<ChallengeApiResponse> {
  return callChallengeOperation('bootstrap', { reset }, signal);
}
