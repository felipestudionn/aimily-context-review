import type { CollectionRevisionImpact, RevisionAlternative } from './impact';
import type { CollectionRevisionDraft } from './revision-draft';

export interface CollectionRevisionBrief {
  schemaVersion: 1;
  artifactHash: string;
  title: string;
  audience: string;
  objective: string;
  executiveSummary: string;
  decisionHighlights: Array<{
    area: string;
    target: string;
    before: unknown;
    after: unknown;
    rationale: string;
    confidence: number;
  }>;
  tradeoffAlternatives: RevisionAlternative[];
  evidenceNotice: string;
  nextStep: string;
}

export function buildCollectionRevisionBrief(params: {
  collectionName: string;
  season: string;
  revision: CollectionRevisionDraft;
  impact: CollectionRevisionImpact;
}): CollectionRevisionBrief {
  const affectedAreas = params.impact.summary.affectedAreas
    .slice(0, 5)
    .map((area) => area.replaceAll('_', ' '))
    .join(', ');
  return {
    schemaVersion: 1,
    artifactHash: params.revision.hash,
    title: `${params.collectionName} ${params.season} · governed wholesale revision`,
    audience: params.revision.presentation.audience ?? 'Collection review team',
    objective: params.revision.presentation.objective ?? 'Explain the approved collection revision and its trade-offs.',
    executiveSummary: `${params.impact.summary.changedDecisions} approved decisions connect the agent signal to ${affectedAreas}. Every consequence remains traceable to explicit evidence, a deterministic calculation or a labelled inference.`,
    decisionHighlights: params.revision.diff.map((line) => ({
      area: line.area,
      target: line.target,
      before: line.before,
      after: line.after,
      rationale: line.reason ?? 'Governed revision proposal.',
      confidence: line.confidence ?? 0,
    })),
    tradeoffAlternatives: params.impact.alternatives,
    evidenceNotice: params.revision.uncertainties.length > 0
      ? `${params.revision.uncertainties.length} provenance limitation${params.revision.uncertainties.length === 1 ? '' : 's'} remain${params.revision.uncertainties.length === 1 ? 's' : ''} visible in the approved record.`
      : 'All referenced originals are available in the approved record.',
    nextStep: 'Use the exact approved artifact for the buyer review, then keep apply and undo receipts with the collection decision record.',
  };
}
