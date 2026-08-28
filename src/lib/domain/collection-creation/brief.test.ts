import { describe, expect, it } from 'vitest';
import { CHALLENGE_COLLECTION, CHALLENGE_CONTEXT_GRAPH, CHALLENGE_REVISION_INPUT } from '@/lib/webmcp-challenge/demo';
import { buildCollectionRevisionBrief } from './brief';
import { buildCollectionRevisionImpact } from './impact';
import { buildCollectionRevisionDraft } from './revision-draft';

describe('approved collection revision brief', () => {
  it('keeps the brief bound to the same artifact and labels its tradeoffs as unselected', () => {
    const revision = buildCollectionRevisionDraft({
      collectionPlanId: CHALLENGE_COLLECTION.id,
      currentDecisions: CHALLENGE_CONTEXT_GRAPH,
      args: CHALLENGE_REVISION_INPUT,
    });
    const impact = buildCollectionRevisionImpact(revision);
    const brief = buildCollectionRevisionBrief({
      collectionName: CHALLENGE_COLLECTION.name,
      season: CHALLENGE_COLLECTION.season,
      revision,
      impact,
    });

    expect(brief.artifactHash).toBe(revision.hash);
    expect(brief.decisionHighlights).toHaveLength(4);
    expect(brief.executiveSummary).toContain('4 approved decisions');
    expect(brief.tradeoffAlternatives.every((item) => item.selected === false)).toBe(true);
    expect(brief.evidenceNotice).toContain('provenance limitation');
  });
});
