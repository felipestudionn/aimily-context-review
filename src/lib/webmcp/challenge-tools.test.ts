import { beforeEach, describe, expect, it, vi } from 'vitest';

const callChallengeOperation = vi.hoisted(() => vi.fn());

vi.mock('@/lib/webmcp-challenge/client', () => ({ callChallengeOperation }));

import { buildChallengeWebMcpTools } from './challenge-tools';
import { CHALLENGE_REVISION_INPUT } from '@/lib/webmcp-challenge/demo';

beforeEach(() => {
  callChallengeOperation.mockReset();
});

describe('WebMCP Challenge intent tools', () => {
  it('registers compact intent tools with explicit trust annotations', () => {
    const tools = buildChallengeWebMcpTools('draft_ready');

    expect(tools.map((tool) => tool.name)).toEqual([
      'read_creation_context',
      'draft_collection_revision',
      'get_collection_revision',
      'inspect_revision_impact',
    ]);
    expect(tools.map((tool) => tool.annotations)).toEqual([
      { readOnlyHint: true, untrustedContentHint: true },
      { readOnlyHint: false, untrustedContentHint: true },
      { readOnlyHint: true, untrustedContentHint: true },
      { readOnlyHint: true, untrustedContentHint: true },
    ]);
    expect(tools.every((tool) => tool.name.length <= 30)).toBe(true);
    expect(tools.every((tool) => tool.description.length <= 500)).toBe(true);
  });

  it('marks every source-bearing result untrusted in every lifecycle stage', () => {
    const stages = ['context_ready', 'draft_ready', 'approved', 'preview_applied', 'preview_reverted'] as const;

    for (const stage of stages) {
      const tools = buildChallengeWebMcpTools(stage);
      expect(tools.every((tool) => tool.annotations.untrustedContentHint)).toBe(true);
      expect(tools.filter((tool) => !tool.annotations.readOnlyHint).map((tool) => tool.name)).toEqual(
        stage === 'approved'
          ? ['apply_approved_revision']
          : stage === 'preview_applied'
            ? ['undo_revision_preview']
            : ['context_ready', 'draft_ready', 'preview_reverted'].includes(stage)
              ? ['draft_collection_revision']
              : [],
      );
    }
  });

  it('exposes recovery only while there is an applied preview to undo', () => {
    expect(buildChallengeWebMcpTools('approved').some((tool) => tool.name === 'undo_revision_preview')).toBe(false);

    const applied = buildChallengeWebMcpTools('preview_applied');
    const undo = applied.find((tool) => tool.name === 'undo_revision_preview');
    expect(undo).toBeDefined();
    expect(undo?.annotations).toEqual({ readOnlyHint: false, untrustedContentHint: true });
  });

  it('exposes apply only after exact-hash human approval and never exposes approval', () => {
    const beforeApproval = buildChallengeWebMcpTools('draft_ready').map((tool) => tool.name);
    const afterApproval = buildChallengeWebMcpTools('approved');
    const afterApply = buildChallengeWebMcpTools('preview_applied').map((tool) => tool.name);

    expect(beforeApproval).not.toContain('approve_collection_revision');
    expect(beforeApproval).not.toContain('apply_approved_revision');
    expect(afterApproval.map((tool) => tool.name)).toContain('apply_approved_revision');
    expect(afterApproval.map((tool) => tool.name)).toContain('read_approved_brief');
    expect(afterApproval.find((tool) => tool.name === 'apply_approved_revision')?.annotations).toEqual({
      readOnlyHint: false,
      untrustedContentHint: true,
    });
    expect(afterApply).not.toContain('apply_approved_revision');
    expect(afterApply).not.toContain('approve_collection_revision');
    expect(buildChallengeWebMcpTools('draft_ready').map((tool) => tool.name)).not.toContain('read_approved_brief');
  });

  it('returns structured results and delegates approved apply to the server boundary', async () => {
    callChallengeOperation.mockResolvedValue({
      ok: true,
      stateToken: 'signed-state',
      state: {
        stage: 'preview_applied',
        revision: null,
        approval: { status: 'approved', artifactHash: 'a'.repeat(64) },
        receipts: [{ action: 'preview_applied' }],
      },
    });
    const tool = buildChallengeWebMcpTools('approved').find((item) => item.name === 'apply_approved_revision');

    const result = await tool?.execute({}, { signal: new AbortController().signal });

    expect(callChallengeOperation).toHaveBeenCalledWith('apply_preview', {}, expect.any(AbortSignal), 'webmcp');
    expect(result).toMatchObject({
      ok: true,
      stage: 'preview_applied',
      safety: { scope: 'isolated_demo_preview', production_data_changed: false },
    });
    expect(typeof result).toBe('object');
  });

  it('executes when the native Chrome testing API omits execution options', async () => {
    callChallengeOperation.mockResolvedValue({
      ok: true,
      stateToken: 'signed-state',
      state: { stage: 'context_ready' },
      context: { collection: { name: 'Asteria', season: 'SS27' } },
    });
    const tool = buildChallengeWebMcpTools('context_ready').find(
      (item) => item.name === 'read_creation_context',
    );

    const result = await tool?.execute({});

    expect(callChallengeOperation).toHaveBeenCalledWith('get_context', {}, undefined, 'webmcp');
    expect(result).toMatchObject({
      ok: true,
      stage: 'context_ready',
      context: { collection: { name: 'Asteria', season: 'SS27' } },
    });
  });

  it('inspects impact through the server and resolves only an exact available focus target', async () => {
    callChallengeOperation.mockResolvedValue({
      ok: true,
      stateToken: 'signed-state',
      state: { stage: 'draft_ready' },
      impact: {
        artifactHash: 'a'.repeat(64),
        nodes: [
          { kind: 'decision', label: 'Core price tier' },
          { kind: 'decision', label: 'Sample rounds' },
        ],
      },
    });
    const tool = buildChallengeWebMcpTools('draft_ready').find((item) => item.name === 'inspect_revision_impact');

    const result = await tool?.execute(
      { focus_target: 'core price tier' },
      { signal: new AbortController().signal },
    );

    expect(callChallengeOperation).toHaveBeenCalledWith('inspect_impact', {}, expect.any(AbortSignal), 'webmcp');
    expect(result).toMatchObject({
      ok: true,
      stage: 'draft_ready',
      focus: {
        requested: 'core price tier',
        resolved: 'Core price tier',
        available_targets: ['Core price tier', 'Sample rounds'],
      },
    });
  });

  it('rejects over-parameterized draft input before any server request', async () => {
    const tool = buildChallengeWebMcpTools('context_ready').find((item) => item.name === 'draft_collection_revision');

    await expect(tool?.execute(
      { ...CHALLENGE_REVISION_INPUT, collection_id: 'foreign-collection' },
      { signal: new AbortController().signal },
    )).rejects.toThrow(/unrecognized key/i);
    expect(callChallengeOperation).not.toHaveBeenCalled();
  });

  it('propagates cancellation to an in-flight WebMCP request', async () => {
    let rejectRequest: (reason: unknown) => void = () => undefined;
    callChallengeOperation.mockImplementation(() => new Promise((_resolve, reject) => {
      rejectRequest = reject;
    }));
    const controller = new AbortController();
    const tool = buildChallengeWebMcpTools('context_ready').find((item) => item.name === 'read_creation_context');
    const pending = tool?.execute({}, { signal: controller.signal });
    const forwardedSignal = callChallengeOperation.mock.calls[0]?.[2] as AbortSignal;
    forwardedSignal.addEventListener(
      'abort',
      () => rejectRequest(new DOMException('Aborted', 'AbortError')),
      { once: true },
    );

    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(callChallengeOperation).toHaveBeenCalledWith('get_context', {}, controller.signal, 'webmcp');
  });
});
