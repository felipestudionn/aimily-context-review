import { createHash } from 'node:crypto';
import type { Decision } from '@/lib/domain/collection-creation/decision';
import type { DomainDiffLine, DomainEvidence } from '@/lib/domain/agent-world/contracts';
import type {
  CollectionCreationArea,
  DraftCollectionRevisionArgs,
} from './contracts';

export interface CollectionRevisionDraft {
  revisionId?: string;
  collectionPlanId: string;
  schemaVersion: 1;
  status: 'pending_human_approval';
  hash: string;
  source: DraftCollectionRevisionArgs['source'];
  diff: Array<DomainDiffLine & {
    area: CollectionCreationArea;
    domain: string;
    subdomain: string;
    key: string;
    evidence: string[];
  }>;
  presentation: {
    requested: boolean;
    audience: string | null;
    objective: string | null;
    status: 'not_requested' | 'pending_revision_approval';
  };
  uncertainties: string[];
  approval: {
    status: 'not_requested';
    requiredActor: 'human';
    artifactHash: string;
  };
  apply: {
    available: false;
    reason: 'approval_contract_pending';
  };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, canonicalize(item)]),
  );
}

function revisionHash(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)))
    .digest('hex');
}

function decisionKey(domain: string, subdomain: string, key: string): string {
  return `${domain}\u0000${subdomain}\u0000${key}`;
}

export function sourceEvidence(source: DraftCollectionRevisionArgs['source']): DomainEvidence {
  return {
    sources: [
      {
        type: source.kind,
        label: source.title ?? `${source.kind} supplied by the user`,
        untrustedContent: true,
      },
      ...source.references.map((reference) => ({
        type: 'reference',
        label: reference.label,
        ...(reference.reference ? { reference: reference.reference } : {}),
        untrustedContent: true,
      })),
    ],
    uncertainties: source.references
      .filter((reference) => !reference.original_file_saved)
      .map((reference) => `The original file for "${reference.label}" is not stored in Aimily; only the agent-provided interpretation is available.`),
  };
}

export function buildCollectionRevisionDraft(params: {
  collectionPlanId: string;
  currentDecisions: Decision[];
  args: DraftCollectionRevisionArgs;
}): CollectionRevisionDraft {
  const current = new Map(
    params.currentDecisions.map((decision) => [
      decisionKey(decision.domain, decision.subdomain, decision.key),
      decision,
    ]),
  );
  const evidence = sourceEvidence(params.args.source);
  const uncertainties = [...evidence.uncertainties];
  const diff = params.args.changes.map((change) => {
    const previous = current.get(decisionKey(
      change.target.domain,
      change.target.subdomain,
      change.target.key,
    ));
    if (!previous) {
      uncertainties.push(
        `No current Context Graph value exists for ${change.target.domain}.${change.target.subdomain}.${change.target.key}; this would create a new decision.`,
      );
    }
    return {
      target: change.target.label
        ?? `${change.target.domain}.${change.target.subdomain}.${change.target.key}`,
      area: change.area,
      domain: change.target.domain,
      subdomain: change.target.subdomain,
      key: change.target.key,
      before: previous?.value ?? null,
      after: change.proposed_value,
      reason: change.rationale,
      confidence: change.confidence,
      evidence: change.evidence,
    };
  });
  const presentation = {
    requested: params.args.presentation?.requested === true,
    audience: params.args.presentation?.audience ?? null,
    objective: params.args.presentation?.objective ?? null,
    status: params.args.presentation?.requested === true
      ? 'pending_revision_approval' as const
      : 'not_requested' as const,
  };
  const hash = revisionHash({
    collectionPlanId: params.collectionPlanId,
    schemaVersion: 1,
    source: params.args.source,
    diff,
    presentation,
  });
  return {
    collectionPlanId: params.collectionPlanId,
    schemaVersion: 1,
    status: 'pending_human_approval',
    hash,
    source: params.args.source,
    diff,
    presentation,
    uncertainties: Array.from(new Set(uncertainties)),
    approval: {
      status: 'not_requested',
      requiredActor: 'human',
      artifactHash: hash,
    },
    apply: {
      available: false,
      reason: 'approval_contract_pending',
    },
  };
}
