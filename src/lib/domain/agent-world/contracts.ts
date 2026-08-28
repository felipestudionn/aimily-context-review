export type AgentSurface = 'ui' | 'aimily-agent' | 'webmcp' | 'remote-mcp';

export interface WorldActor {
  userId: string;
  surface: AgentSurface;
  requestId: string;
  connectionId?: string;
  client?: {
    name: string;
    version?: string;
  };
  scopes?: string[];
}

export type DomainOperationClass =
  | 'read'
  | 'draft'
  | 'approval-request'
  | 'apply'
  | 'sensitive'
  | 'recovery';

export type DomainErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'TARGET_MARGIN_REQUIRED'
  | 'RUN_NOT_READY'
  | 'INSUFFICIENT_DATA'
  | 'PERSISTENCE_FAILED'
  | 'CONFLICT'
  | 'APPROVAL_REQUIRED'
  | 'APPROVAL_INVALID'
  | 'RATE_LIMITED'
  | 'UNSUPPORTED_CLIENT';

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export interface DomainEnvelope<T> {
  ok: true;
  operation: string;
  version: 1;
  traceId: string;
  data: T;
  warnings: string[];
  artifact?: DomainArtifactRef;
  diff?: DomainDiffLine[];
  evidence?: DomainEvidence;
  approval?: DomainApprovalRef;
  receipt?: DomainReceiptRef;
  viewTarget?: DomainViewTarget;
  job?: DomainJobRef;
}

export interface DomainArtifactRef {
  id: string;
  type: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'applied' | 'reverted' | 'failed';
  version: number;
  hash?: string;
}

export interface DomainDiffLine {
  target: string;
  before: unknown;
  after: unknown;
  reason?: string;
  confidence?: number;
}

export interface DomainEvidence {
  sources: Array<{
    type: string;
    label: string;
    reference?: string;
    untrustedContent?: boolean;
  }>;
  uncertainties: string[];
}

export interface DomainApprovalRef {
  status: 'not_requested' | 'pending' | 'approved' | 'denied' | 'expired';
  artifactHash: string;
  approvalId?: string;
  expiresAt?: string;
  requiredActor: 'human';
}

export interface DomainReceiptRef {
  id: string;
  action: string;
  actorUserId: string;
  occurredAt: string;
  auditId?: string;
  undoAvailable: boolean;
}

export interface DomainViewTarget {
  collectionPlanId?: string;
  workspace?: string;
  block?: string;
  artifactId?: string;
  url?: string;
}

export interface DomainJobRef {
  id: string;
  status: 'queued' | 'running' | 'input_required' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
}

export function domainEnvelope<T>(params: {
  operation: string;
  traceId: string;
  data: T;
  warnings?: string[];
  artifact?: DomainArtifactRef;
  diff?: DomainDiffLine[];
  evidence?: DomainEvidence;
  approval?: DomainApprovalRef;
  receipt?: DomainReceiptRef;
  viewTarget?: DomainViewTarget;
  job?: DomainJobRef;
}): DomainEnvelope<T> {
  return {
    ok: true,
    operation: params.operation,
    version: 1,
    traceId: params.traceId,
    data: params.data,
    warnings: params.warnings ?? [],
    ...(params.artifact ? { artifact: params.artifact } : {}),
    ...(params.diff ? { diff: params.diff } : {}),
    ...(params.evidence ? { evidence: params.evidence } : {}),
    ...(params.approval ? { approval: params.approval } : {}),
    ...(params.receipt ? { receipt: params.receipt } : {}),
    ...(params.viewTarget ? { viewTarget: params.viewTarget } : {}),
    ...(params.job ? { job: params.job } : {}),
  };
}
