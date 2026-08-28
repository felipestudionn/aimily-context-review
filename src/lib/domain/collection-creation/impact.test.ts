import { describe, expect, it } from 'vitest';
import { CHALLENGE_COLLECTION, CHALLENGE_CONTEXT_GRAPH, CHALLENGE_REVISION_INPUT } from '@/lib/webmcp-challenge/demo';
import { buildCollectionRevisionDraft } from './revision-draft';
import { buildCollectionRevisionImpact } from './impact';

describe('collection revision impact graph', () => {
  it('derives a traceable graph, consequences and unselected alternatives from the signed draft', () => {
    const revision = buildCollectionRevisionDraft({
      collectionPlanId: CHALLENGE_COLLECTION.id,
      currentDecisions: CHALLENGE_CONTEXT_GRAPH,
      args: CHALLENGE_REVISION_INPUT,
    });

    const impact = buildCollectionRevisionImpact(revision);

    expect(impact.artifactHash).toBe(revision.hash);
    expect(impact.summary).toMatchObject({
      changedDecisions: 4,
      explicitConsequences: 6,
      inferredConsequences: 4,
    });
    expect(impact.nodes.filter((node) => node.kind === 'decision')).toHaveLength(4);
    expect(impact.nodes.at(-1)).toMatchObject({ kind: 'approval', evidenceKind: 'policy' });
    expect(impact.edges.every((edge) => impact.nodes.some((node) => node.id === edge.from))).toBe(true);
    expect(impact.edges.every((edge) => impact.nodes.some((node) => node.id === edge.to))).toBe(true);
    expect(impact.consequences).toEqual(expect.arrayContaining([
      expect.objectContaining({ evidenceKind: 'computed', statement: expect.stringContaining('85 to 60') }),
      expect.objectContaining({ evidenceKind: 'computed', statement: expect.stringContaining('from 3 to 2') }),
      expect.objectContaining({ evidenceKind: 'inference' }),
    ]));
    expect(impact.alternatives).toHaveLength(2);
    expect(impact.alternatives.every((alternative) => alternative.selected === false)).toBe(true);
  });
});
