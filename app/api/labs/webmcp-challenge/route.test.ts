import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHALLENGE_REVISION_INPUT } from '@/lib/webmcp-challenge/demo';

const cookieValues = vi.hoisted(() => new Map<string, string>());
const allow = vi.hoisted(() => vi.fn(() => true));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieValues.get(name);
      return value ? { name, value } : undefined;
    },
    set: (name: string, value: string) => cookieValues.set(name, value),
  }),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: { allow },
  clientIp: () => '127.0.0.1',
}));

import { POST } from './route';

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://www.aimily.ai/api/labs/webmcp-challenge', {
    method: 'POST',
    headers: { 'content-type': 'application/json', host: 'www.aimily.ai', ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  cookieValues.clear();
  allow.mockClear();
  allow.mockReturnValue(true);
});

describe('WebMCP Challenge route boundary', () => {
  it('bootstraps a signed sandbox without product credentials', async () => {
    const res = await POST(request({ operation: 'bootstrap', reset: false }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.state.stage).toBe('context_ready');
    expect(body.stateToken).toEqual(expect.any(String));
    expect(body.context.collection.name).toBe('Asteria');
    expect(cookieValues.get('aimily_webmcp_challenge_session')).toEqual(expect.any(String));
    expect(res.headers.get('cache-control')).toBe('private, no-store');
  });

  it('enforces the draft then exact-hash approval sequence server-side', async () => {
    const bootstrap = await POST(request({ operation: 'bootstrap', reset: false }));
    const start = await bootstrap.json();
    const drafted = await POST(request({
      operation: 'draft_revision',
      stateToken: start.stateToken,
      args: CHALLENGE_REVISION_INPUT,
    }));
    const draft = await drafted.json();

    expect(drafted.status).toBe(200);
    expect(draft.state.stage).toBe('draft_ready');

    const inspected = await POST(request({
      operation: 'inspect_impact',
      stateToken: draft.stateToken,
    }));
    const impact = await inspected.json();
    expect(inspected.status).toBe(200);
    expect(impact.impact.artifactHash).toBe(draft.state.revision.hash);
    expect(impact.impact.summary.changedDecisions).toBe(4);

    const earlyBrief = await POST(request({
      operation: 'get_approved_brief',
      stateToken: draft.stateToken,
    }));
    expect(earlyBrief.status).toBe(409);

    const rejected = await POST(request({
      operation: 'approve_revision',
      stateToken: draft.stateToken,
      artifactHash: '0'.repeat(64),
    }));
    expect(rejected.status).toBe(409);

    const approved = await POST(request({
      operation: 'approve_revision',
      stateToken: draft.stateToken,
      artifactHash: draft.state.revision.hash,
    }));
    const body = await approved.json();
    expect(body.state.stage).toBe('approved');
    expect(body.state.receipts[0].action).toBe('human_approved');
    expect(body.receiptVerification).toMatchObject({
      valid: true,
      integrity: 'verified',
      receiptCount: 1,
      artifactHash: draft.state.revision.hash,
      stateTokenStatus: 'server_hmac_signed_current_session',
    });

    const briefResponse = await POST(request({
      operation: 'get_approved_brief',
      stateToken: body.stateToken,
    }));
    const brief = await briefResponse.json();
    expect(briefResponse.status).toBe(200);
    expect(brief.brief.artifactHash).toBe(body.state.revision.hash);
    expect(brief.brief.decisionHighlights).toHaveLength(4);
  });

  it('rejects cross-origin browser calls before reading signed state', async () => {
    const res = await POST(request(
      { operation: 'bootstrap', reset: false },
      { origin: 'https://malicious.example' },
    ));

    expect(res.status).toBe(403);
    expect(allow).not.toHaveBeenCalled();
  });

  it('rate limits the public sandbox boundary', async () => {
    allow.mockReturnValueOnce(false);

    const res = await POST(request({ operation: 'bootstrap', reset: false }));
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('30');
  });

  it('rejects unknown fields and invalid nested tool arguments', async () => {
    const overParameterized = await POST(request({
      operation: 'bootstrap',
      reset: false,
      role: 'owner',
    }));
    expect(overParameterized.status).toBe(400);

    const bootstrap = await POST(request({ operation: 'bootstrap', reset: false }));
    const start = await bootstrap.json();
    const invalid = structuredClone(CHALLENGE_REVISION_INPUT);
    invalid.changes[0].confidence = 2;
    const invalidDraft = await POST(request({
      operation: 'draft_revision',
      stateToken: start.stateToken,
      args: invalid,
    }));
    expect(invalidDraft.status).toBe(400);
  });

  it('rejects replay of an older valid state token', async () => {
    const bootstrap = await POST(request({ operation: 'bootstrap', reset: false }));
    const start = await bootstrap.json();
    const drafted = await POST(request({
      operation: 'draft_revision',
      stateToken: start.stateToken,
      args: CHALLENGE_REVISION_INPUT,
    }));
    expect(drafted.status).toBe(200);

    const replay = await POST(request({
      operation: 'get_state',
      stateToken: start.stateToken,
    }));
    const body = await replay.json();

    expect(replay.status).toBe(409);
    expect(body.error).toMatch(/stale/i);
  });
});
