import { describe, expect, it } from 'vitest';
import { CHALLENGE_REVISION_INPUT } from './demo';
import {
  applyChallengePreview,
  approveChallengeRevision,
  createInitialChallengeState,
  draftChallengeRevision,
  undoChallengePreview,
  verifyChallengeReceiptChain,
} from './lifecycle';

describe('WebMCP Challenge governed lifecycle', () => {
  it('creates a real diff through the canonical collection revision builder', () => {
    const initial = createInitialChallengeState('session-1', '2026-08-27T09:00:00.000Z');
    const draft = draftChallengeRevision(initial, CHALLENGE_REVISION_INPUT, '2026-08-27T09:01:00.000Z');

    expect(draft.stage).toBe('draft_ready');
    expect(draft.revision?.diff).toHaveLength(4);
    expect(draft.revision?.diff[0]).toMatchObject({
      target: 'Collection tension',
      before: 'Polished structure softened by coastal ease',
      after: 'Polished structure warmed by tactile coastal ease',
    });
    expect(draft.revision?.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(draft.revision?.uncertainties).toHaveLength(CHALLENGE_REVISION_INPUT.source.references.length);
  });

  it('binds human approval to the exact artifact hash', () => {
    const draft = draftChallengeRevision(
      createInitialChallengeState('session-1'),
      CHALLENGE_REVISION_INPUT,
    );

    expect(() => approveChallengeRevision(draft, '0'.repeat(64))).toThrow(/revision changed/i);
    const approved = approveChallengeRevision(draft, draft.revision!.hash, '2026-08-27T09:02:00.000Z');

    expect(approved.stage).toBe('approved');
    expect(approved.approval).toMatchObject({
      status: 'approved',
      artifactHash: draft.revision!.hash,
    });
    expect(approved.receipts[0]).toMatchObject({ action: 'human_approved', undoAvailable: false });
    expect(approved.receipts[0]).toMatchObject({
      scope: 'isolated_demo_preview',
      previousReceiptHash: null,
      receiptHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
  });

  it('rejects apply without approval and preserves an auditable undo trail', () => {
    const draft = draftChallengeRevision(
      createInitialChallengeState('session-1'),
      CHALLENGE_REVISION_INPUT,
    );
    expect(() => applyChallengePreview(draft)).toThrow(/approval/i);

    const approved = approveChallengeRevision(draft, draft.revision!.hash, '2026-08-27T09:02:00.000Z');
    const applied = applyChallengePreview(approved, '2026-08-27T09:03:00.000Z');
    const reverted = undoChallengePreview(applied, '2026-08-27T09:04:00.000Z');

    expect(applied.stage).toBe('preview_applied');
    expect(reverted.stage).toBe('preview_reverted');
    expect(reverted.receipts.map((item) => item.action)).toEqual([
      'human_approved',
      'preview_applied',
      'preview_reverted',
    ]);
    expect(reverted.receipts.at(-1)?.undoAvailable).toBe(false);
    expect(applied.receipts[1].previousReceiptHash).toBe(applied.receipts[0].receiptHash);
    expect(reverted.receipts[2].previousReceiptHash).toBe(reverted.receipts[1].receiptHash);

    const verified = verifyChallengeReceiptChain(reverted.receipts, reverted.revision!.hash);
    expect(verified).toMatchObject({
      valid: true,
      integrity: 'verified',
      receiptCount: 3,
      chainHead: reverted.receipts[2].receiptHash,
      checks: {
        hashes: true,
        links: true,
        artifact: true,
        sequence: true,
        policy: true,
        chronology: true,
        identity: true,
      },
    });

    const tampered = structuredClone(reverted.receipts);
    tampered[1].actor = 'challenge-human';
    expect(verifyChallengeReceiptChain(tampered, reverted.revision!.hash)).toMatchObject({
      valid: false,
      integrity: 'invalid',
      checks: { hashes: false, policy: false },
    });

    expect(verifyChallengeReceiptChain(reverted.receipts, '0'.repeat(64))).toMatchObject({
      valid: false,
      checks: { artifact: false },
    });

    const reordered = [reverted.receipts[0], reverted.receipts[2], reverted.receipts[1]];
    expect(verifyChallengeReceiptChain(reordered, reverted.revision!.hash)).toMatchObject({
      valid: false,
      checks: { links: false, sequence: false, chronology: false },
    });
  });

  it('does not allow undo before an approved preview is applied', () => {
    const draft = draftChallengeRevision(
      createInitialChallengeState('session-1'),
      CHALLENGE_REVISION_INPUT,
    );
    const approved = approveChallengeRevision(draft, draft.revision!.hash);

    expect(() => undoChallengePreview(approved)).toThrow(/applied preview/i);
  });

  it('does not replace an active approval or applied preview with a new draft', () => {
    const draft = draftChallengeRevision(
      createInitialChallengeState('session-1'),
      CHALLENGE_REVISION_INPUT,
    );
    const approved = approveChallengeRevision(draft, draft.revision!.hash);
    const applied = applyChallengePreview(approved);

    expect(() => draftChallengeRevision(approved, CHALLENGE_REVISION_INPUT)).toThrow(/undo.*reset/i);
    expect(() => draftChallengeRevision(applied, CHALLENGE_REVISION_INPUT)).toThrow(/undo.*reset/i);
  });
});
