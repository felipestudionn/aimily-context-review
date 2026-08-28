import type { CollectionRevisionDraft } from '@/lib/domain/collection-creation/revision-draft';

export type ChallengeStage =
  | 'context_ready'
  | 'draft_ready'
  | 'approved'
  | 'preview_applied'
  | 'preview_reverted';

export interface ChallengeReceipt {
  id: string;
  action: 'human_approved' | 'preview_applied' | 'preview_reverted';
  actor: 'challenge-human' | 'aimily-policy';
  scope: 'isolated_demo_preview';
  occurredAt: string;
  artifactHash: string;
  previousReceiptHash: string | null;
  receiptHash: string;
  summary: string;
  undoAvailable: boolean;
}

export interface ChallengeReceiptChainVerification {
  valid: boolean;
  integrity: 'verified' | 'invalid';
  receiptCount: number;
  chainHead: string | null;
  artifactHash: string | null;
  checks: {
    hashes: boolean;
    links: boolean;
    artifact: boolean;
    sequence: boolean;
    policy: boolean;
    chronology: boolean;
    identity: boolean;
  };
}

export interface ChallengeReceiptVerification extends ChallengeReceiptChainVerification {
  stateTokenStatus: 'server_hmac_signed_current_session';
}

export interface ChallengeState {
  schemaVersion: 1;
  sessionId: string;
  collectionId: string;
  stage: ChallengeStage;
  revision: CollectionRevisionDraft | null;
  approval: {
    status: 'not_requested' | 'approved';
    approvalId: string | null;
    artifactHash: string | null;
    approvedAt: string | null;
  };
  receipts: ChallengeReceipt[];
  updatedAt: string;
}

export interface ChallengeStateResponse {
  ok: true;
  state: ChallengeState;
  stateToken: string;
  receiptVerification: ChallengeReceiptVerification;
}
