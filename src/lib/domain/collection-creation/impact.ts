import type { CollectionRevisionDraft } from './revision-draft';

export type RevisionImpactEvidenceKind = 'source' | 'explicit' | 'computed' | 'inference' | 'policy';

export interface RevisionImpactNode {
  id: string;
  kind: 'source' | 'decision' | 'outcome' | 'approval';
  area: string;
  label: string;
  summary: string;
  confidence: number | null;
  evidenceKind: RevisionImpactEvidenceKind;
  evidence: string[];
}

export interface RevisionImpactEdge {
  from: string;
  to: string;
  relationship: string;
  evidenceKind: RevisionImpactEvidenceKind;
}

export interface RevisionConsequence {
  id: string;
  sourceNodeId: string;
  statement: string;
  affectedAreas: string[];
  evidenceKind: Exclude<RevisionImpactEvidenceKind, 'source' | 'policy'>;
}

export interface RevisionAlternative {
  id: 'showroom_first' | 'assurance_first';
  label: string;
  summary: string;
  preserves: string[];
  tradeoffs: string[];
  selected: false;
}

export interface CollectionRevisionImpact {
  artifactHash: string;
  summary: {
    changedDecisions: number;
    affectedAreas: string[];
    averageConfidence: number;
    explicitConsequences: number;
    inferredConsequences: number;
  };
  nodes: RevisionImpactNode[];
  edges: RevisionImpactEdge[];
  consequences: RevisionConsequence[];
  alternatives: RevisionAlternative[];
}

function labelValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.min === 'number' && typeof record.max === 'number') {
      return `${record.min}-${record.max} ${String(record.currency ?? '').trim()}`.trim();
    }
    return JSON.stringify(value);
  }
  return value === null ? 'no current value' : String(value);
}

function nodeId(domain: string, subdomain: string, key: string): string {
  return `decision:${domain}.${subdomain}.${key}`;
}

function computedConsequence(
  line: CollectionRevisionDraft['diff'][number],
  sourceNodeId: string,
): RevisionConsequence | null {
  if (line.area === 'pricing' && line.before && line.after
    && typeof line.before === 'object' && typeof line.after === 'object') {
    const before = line.before as Record<string, unknown>;
    const after = line.after as Record<string, unknown>;
    if ([before.min, before.max, after.min, after.max].every((value) => typeof value === 'number')) {
      const beforeWidth = Number(before.max) - Number(before.min);
      const afterWidth = Number(after.max) - Number(after.min);
      return {
        id: `${sourceNodeId}:computed`,
        sourceNodeId,
        statement: `The core price span narrows from ${beforeWidth} to ${afterWidth} ${String(after.currency ?? before.currency ?? 'EUR')}.`,
        affectedAreas: ['pricing', 'assortment', 'presentation'],
        evidenceKind: 'computed',
      };
    }
  }
  if (line.area === 'calendar' && typeof line.before === 'number' && typeof line.after === 'number') {
    const delta = line.after - line.before;
    return {
      id: `${sourceNodeId}:computed`,
      sourceNodeId,
      statement: `The plan changes sample rounds by ${delta}, from ${line.before} to ${line.after}.`,
      affectedAreas: ['calendar', 'materials', 'presentation'],
      evidenceKind: 'computed',
    };
  }
  return null;
}

const INFERRED_EFFECTS: Partial<Record<CollectionRevisionDraft['diff'][number]['area'], {
  statement: string;
  affectedAreas: string[];
}>> = {
  creative_direction: {
    statement: 'A warmer creative tension is likely to influence surface, casting and styling choices downstream.',
    affectedAreas: ['creative_direction', 'materials', 'moodboard', 'presentation'],
  },
  materials: {
    statement: 'Introducing ramie is likely to require supplier feasibility, wash testing and updated product storytelling.',
    affectedAreas: ['materials', 'calendar', 'pricing', 'presentation'],
  },
  pricing: {
    statement: 'A tighter core tier may concentrate the assortment around fewer perceived-value bands.',
    affectedAreas: ['pricing', 'assortment', 'presentation'],
  },
  calendar: {
    statement: 'Fewer sample rounds increase the importance of preserving fit and pre-production approval gates.',
    affectedAreas: ['calendar', 'materials', 'presentation'],
  },
};

export function buildCollectionRevisionImpact(revision: CollectionRevisionDraft): CollectionRevisionImpact {
  const sourceNode: RevisionImpactNode = {
    id: 'source:agent-signal',
    kind: 'source',
    area: 'source',
    label: revision.source.title ?? 'Agent signal',
    summary: revision.source.summary,
    confidence: null,
    evidenceKind: 'source',
    evidence: revision.source.references.map((reference) => reference.label),
  };
  const decisionNodes = revision.diff.map<RevisionImpactNode>((line) => ({
    id: nodeId(line.domain, line.subdomain, line.key),
    kind: 'decision',
    area: line.area,
    label: line.target,
    summary: `${labelValue(line.before)} becomes ${labelValue(line.after)}.`,
    confidence: line.confidence ?? 0,
    evidenceKind: 'explicit',
    evidence: line.evidence,
  }));
  const presentationNode: RevisionImpactNode | null = revision.presentation.requested ? {
    id: 'outcome:presentation',
    kind: 'outcome',
    area: 'presentation',
    label: 'Buyer-ready review',
    summary: revision.presentation.objective ?? 'Explain the approved revision and its trade-offs.',
    confidence: null,
    evidenceKind: 'inference',
    evidence: ['Generated only after the revision is approved.'],
  } : null;
  const approvalNode: RevisionImpactNode = {
    id: 'approval:exact-hash',
    kind: 'approval',
    area: 'governance',
    label: 'Exact-hash approval',
    summary: 'A human must approve this immutable artifact before apply becomes available.',
    confidence: null,
    evidenceKind: 'policy',
    evidence: [revision.hash],
  };

  const consequences = revision.diff.flatMap((line) => {
    const sourceNodeId = nodeId(line.domain, line.subdomain, line.key);
    const explicit: RevisionConsequence = {
      id: `${sourceNodeId}:explicit`,
      sourceNodeId,
      statement: line.reason ?? `${line.target} changes from ${labelValue(line.before)} to ${labelValue(line.after)}.`,
      affectedAreas: [line.area],
      evidenceKind: 'explicit',
    };
    const computed = computedConsequence(line, sourceNodeId);
    const inferred = INFERRED_EFFECTS[line.area];
    return [
      explicit,
      ...(computed ? [computed] : []),
      ...(inferred ? [{
        id: `${sourceNodeId}:inference`,
        sourceNodeId,
        statement: inferred.statement,
        affectedAreas: inferred.affectedAreas,
        evidenceKind: 'inference' as const,
      }] : []),
    ];
  });

  const edges: RevisionImpactEdge[] = decisionNodes.flatMap((node) => [
    {
      from: sourceNode.id,
      to: node.id,
      relationship: 'supports proposed change',
      evidenceKind: 'explicit' as const,
    },
    {
      from: node.id,
      to: approvalNode.id,
      relationship: 'requires human review',
      evidenceKind: 'policy' as const,
    },
    ...(presentationNode ? [{
      from: node.id,
      to: presentationNode.id,
      relationship: 'shapes approved review',
      evidenceKind: 'inference' as const,
    }] : []),
  ]);

  const affectedAreas = Array.from(new Set(consequences.flatMap((item) => item.affectedAreas)));
  const averageConfidence = revision.diff.length === 0
    ? 0
    : revision.diff.reduce((total, line) => total + (line.confidence ?? 0), 0) / revision.diff.length;

  return {
    artifactHash: revision.hash,
    summary: {
      changedDecisions: revision.diff.length,
      affectedAreas,
      averageConfidence: Number(averageConfidence.toFixed(3)),
      explicitConsequences: consequences.filter((item) => item.evidenceKind !== 'inference').length,
      inferredConsequences: consequences.filter((item) => item.evidenceKind === 'inference').length,
    },
    nodes: [sourceNode, ...decisionNodes, ...(presentationNode ? [presentationNode] : []), approvalNode],
    edges,
    consequences,
    alternatives: [
      {
        id: 'showroom_first',
        label: 'Showroom-first path',
        summary: 'Use the proposed two-round sample plan and parallelise material validation.',
        preserves: ['Showroom date', 'Exact-hash approval', 'Fit and pre-production gates'],
        tradeoffs: ['Less cosmetic iteration time', 'Earlier supplier feasibility decision'],
        selected: false,
      },
      {
        id: 'assurance_first',
        label: 'Assurance-first path',
        summary: 'Keep the current third sample round and move the showroom dependency if validation needs more time.',
        preserves: ['Third sample review', 'Material validation depth', 'Exact-hash approval'],
        tradeoffs: ['Potential showroom-date pressure', 'Longer approval cycle'],
        selected: false,
      },
    ],
  };
}
