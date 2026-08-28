import { createHash, randomUUID } from 'node:crypto';
import { DomainError } from '@/lib/domain/agent-world/contracts';
import { buildCollectionRevisionDraft } from '@/lib/domain/collection-creation/revision-draft';
import type { DraftCollectionRevisionArgs } from '@/lib/domain/collection-creation/contracts';
import {
  CHALLENGE_COLLECTION,
  CHALLENGE_CONTEXT_GRAPH,
} from './demo';
import type {
  ChallengeReceipt,
  ChallengeReceiptChainVerification,
  ChallengeState,
} from './types';

const RECEIPT_POLICY: Record<
  ChallengeReceipt['action'],
  Pick<ChallengeReceipt, 'actor' | 'summary' | 'undoAvailable'>
> = {
  human_approved: {
    actor: 'challenge-human',
    summary: 'The signed-in human approved this exact revision hash for the isolated preview.',
    undoAvailable: false,
  },
  preview_applied: {
    actor: 'aimily-policy',
    summary: 'Aimily applied the approved diff to the isolated Context Graph preview. Canonical collection data remains untouched.',
    undoAvailable: true,
  },
  preview_reverted: {
    actor: 'aimily-policy',
    summary: 'Aimily restored the preview to the original Context Graph without changing the approved revision record.',
    undoAvailable: false,
  },
};

const RECEIPT_SEQUENCE: ChallengeReceipt['action'][] = [
  'human_approved',
  'preview_applied',
  'preview_reverted',
];

type ChallengeReceiptPayload = Omit<ChallengeReceipt, 'receiptHash'>;

function iso(now: Date | string): string {
  return typeof now === 'string' ? now : now.toISOString();
}

function receiptPayload(receipt: ChallengeReceiptPayload | ChallengeReceipt): ChallengeReceiptPayload {
  return {
    id: receipt.id,
    action: receipt.action,
    scope: receipt.scope,
    artifactHash: receipt.artifactHash,
    previousReceiptHash: receipt.previousReceiptHash,
    occurredAt: receipt.occurredAt,
    actor: receipt.actor,
    summary: receipt.summary,
    undoAvailable: receipt.undoAvailable,
  };
}

function hashReceipt(receipt: ChallengeReceiptPayload | ChallengeReceipt): string {
  return createHash('sha256').update(JSON.stringify(receiptPayload(receipt))).digest('hex');
}

function receipt(
  action: ChallengeReceipt['action'],
  artifactHash: string,
  now: string,
  previousReceiptHash: string | null,
): ChallengeReceipt {
  const value: ChallengeReceiptPayload = {
    id: randomUUID(),
    action,
    scope: 'isolated_demo_preview' as const,
    artifactHash,
    previousReceiptHash,
    occurredAt: now,
    ...RECEIPT_POLICY[action],
  };
  return {
    ...value,
    receiptHash: hashReceipt(value),
  };
}

export function verifyChallengeReceiptChain(
  receipts: ChallengeReceipt[],
  expectedArtifactHash: string | null,
): ChallengeReceiptChainVerification {
  const checks = {
    hashes: receipts.every((item) => item.receiptHash === hashReceipt(item)),
    links: receipts.every((item, index) => (
      item.previousReceiptHash === (index === 0 ? null : receipts[index - 1].receiptHash)
    )),
    artifact: receipts.every((item) => (
      expectedArtifactHash !== null && item.artifactHash === expectedArtifactHash
    )),
    sequence: receipts.length <= RECEIPT_SEQUENCE.length && receipts.every((item, index) => (
      item.action === RECEIPT_SEQUENCE[index]
    )),
    policy: receipts.every((item) => {
      const expected = RECEIPT_POLICY[item.action];
      return Boolean(expected)
        && item.scope === 'isolated_demo_preview'
        && item.actor === expected.actor
        && item.summary === expected.summary
        && item.undoAvailable === expected.undoAvailable;
    }),
    chronology: receipts.every((item, index) => {
      const occurredAt = Date.parse(item.occurredAt);
      if (!Number.isFinite(occurredAt)) return false;
      if (index === 0) return true;
      return occurredAt >= Date.parse(receipts[index - 1].occurredAt);
    }),
    identity: new Set(receipts.map((item) => item.id)).size === receipts.length
      && receipts.every((item) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.id)),
  };
  const valid = Object.values(checks).every(Boolean);
  return {
    valid,
    integrity: valid ? 'verified' : 'invalid',
    receiptCount: receipts.length,
    chainHead: receipts.at(-1)?.receiptHash ?? null,
    artifactHash: expectedArtifactHash,
    checks,
  };
}

export function createInitialChallengeState(sessionId: string, now: Date | string = new Date()): ChallengeState {
  return {
    schemaVersion: 1,
    sessionId,
    collectionId: CHALLENGE_COLLECTION.id,
    stage: 'context_ready',
    revision: null,
    approval: {
      status: 'not_requested',
      approvalId: null,
      artifactHash: null,
      approvedAt: null,
    },
    receipts: [],
    updatedAt: iso(now),
  };
}

export function draftChallengeRevision(
  state: ChallengeState,
  args: DraftCollectionRevisionArgs,
  now: Date | string = new Date(),
): ChallengeState {
  if (!['context_ready', 'draft_ready', 'preview_reverted'].includes(state.stage)) {
    throw new DomainError(
      'CONFLICT',
      'Undo the active preview or reset the sandbox before drafting another revision.',
      409,
    );
  }
  const revision = buildCollectionRevisionDraft({
    collectionPlanId: CHALLENGE_COLLECTION.id,
    currentDecisions: CHALLENGE_CONTEXT_GRAPH,
    args,
  });
  return {
    ...state,
    stage: 'draft_ready',
    revision: { ...revision, revisionId: randomUUID() },
    approval: {
      status: 'not_requested',
      approvalId: null,
      artifactHash: revision.hash,
      approvedAt: null,
    },
    receipts: [],
    updatedAt: iso(now),
  };
}

export function approveChallengeRevision(
  state: ChallengeState,
  artifactHash: string,
  now: Date | string = new Date(),
): ChallengeState {
  if (!state.revision || state.stage !== 'draft_ready') {
    throw new DomainError('CONFLICT', 'A current draft is required before approval.', 409);
  }
  if (state.revision.hash !== artifactHash) {
    throw new DomainError('APPROVAL_INVALID', 'The revision changed. Review the current diff before approving it.', 409);
  }
  const occurredAt = iso(now);
  const approvalId = randomUUID();
  return {
    ...state,
    stage: 'approved',
    approval: {
      status: 'approved',
      approvalId,
      artifactHash,
      approvedAt: occurredAt,
    },
    receipts: [...state.receipts, receipt(
      'human_approved',
      artifactHash,
      occurredAt,
      state.receipts.at(-1)?.receiptHash ?? null,
    )],
    updatedAt: occurredAt,
  };
}

export function applyChallengePreview(state: ChallengeState, now: Date | string = new Date()): ChallengeState {
  if (!state.revision || state.stage !== 'approved' || state.approval.status !== 'approved') {
    throw new DomainError('APPROVAL_REQUIRED', 'Human approval for the current revision hash is required.', 409);
  }
  if (state.approval.artifactHash !== state.revision.hash) {
    throw new DomainError('APPROVAL_INVALID', 'The approval does not match the current revision.', 409);
  }
  const occurredAt = iso(now);
  return {
    ...state,
    stage: 'preview_applied',
    receipts: [...state.receipts, receipt(
      'preview_applied',
      state.revision.hash,
      occurredAt,
      state.receipts.at(-1)?.receiptHash ?? null,
    )],
    updatedAt: occurredAt,
  };
}

export function undoChallengePreview(state: ChallengeState, now: Date | string = new Date()): ChallengeState {
  if (!state.revision || state.stage !== 'preview_applied') {
    throw new DomainError('CONFLICT', 'Only an applied preview can be undone.', 409);
  }
  const occurredAt = iso(now);
  return {
    ...state,
    stage: 'preview_reverted',
    receipts: [...state.receipts, receipt(
      'preview_reverted',
      state.revision.hash,
      occurredAt,
      state.receipts.at(-1)?.receiptHash ?? null,
    )],
    updatedAt: occurredAt,
  };
}
