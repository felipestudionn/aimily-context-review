import type { Decision } from '@/lib/domain/collection-creation/decision';
import type { DraftCollectionRevisionArgs } from '@/lib/domain/collection-creation/contracts';

export const CHALLENGE_COLLECTION = {
  id: '2c60b854-dbe7-4b43-a02e-6a0563580c75',
  name: 'Asteria',
  season: 'SS27',
  status: 'Direction in review',
  description: 'A Mediterranean tailoring collection built around light structure, mineral colour and traceable natural materials.',
};

function decision(
  id: string,
  domain: string,
  subdomain: string,
  key: string,
  value: unknown,
  rationale: string,
  sourcePhase: string,
): Decision {
  return {
    id,
    collection_plan_id: CHALLENGE_COLLECTION.id,
    domain,
    subdomain,
    key,
    value,
    value_type: Array.isArray(value) ? 'list' : typeof value === 'object' ? 'object' : typeof value,
    rationale,
    confidence: 'approved',
    source: 'user_input',
    source_phase: sourcePhase,
    source_component: 'webmcp-challenge-seed',
    version: 3,
    is_current: true,
    decided_by: 'challenge-human',
    decided_at: '2026-08-25T09:30:00.000Z',
    tags: ['challenge-demo'],
  };
}

export const CHALLENGE_CONTEXT_GRAPH: Decision[] = [
  decision(
    'f0fab86f-7825-488e-bc3c-55cd8e85d953',
    'creative',
    'direction',
    'collection_tension',
    'Polished structure softened by coastal ease',
    'The collection must feel intentional without becoming formal.',
    'creative',
  ),
  decision(
    '6a971b10-8414-4583-aa9d-2b54cfef9f9d',
    'creative',
    'palette',
    'core_colours',
    ['chalk', 'salt', 'deep ink', 'sun-warmed clay'],
    'A quiet mineral palette keeps tailoring and natural texture coherent.',
    'creative',
  ),
  decision(
    'f30210f7-75aa-4d28-93d6-c9c88098f504',
    'design',
    'materials',
    'hero_materials',
    ['linen twill', 'washed cotton poplin', 'lightweight wool'],
    'Natural fibres with enough body to hold the collection silhouette.',
    'design',
  ),
  decision(
    '59076748-4101-41ca-b0b8-7c2885bbdf0e',
    'design',
    'calendar',
    'sample_rounds',
    3,
    'Three rounds protect fit quality before production handoff.',
    'design',
  ),
  decision(
    '769f3c42-8fd9-48cf-9826-fe9a6ef3330f',
    'merchandising',
    'pricing',
    'core_tier',
    { min: 135, max: 220, currency: 'EUR' },
    'The core tier holds the perceived-value centre of the assortment.',
    'merchandising',
  ),
];

const CHALLENGE_REVISION_CHANGES: DraftCollectionRevisionArgs['changes'] = [
  {
    area: 'creative_direction',
    target: {
      domain: 'creative',
      subdomain: 'direction',
      key: 'collection_tension',
      label: 'Collection tension',
    },
    proposed_value: 'Polished structure warmed by tactile coastal ease',
    rationale: 'The buyer understood the precision but asked for more emotional warmth in the opening story.',
    evidence: ['Buyer language in the meeting recap', 'Texture response observed in the fitting discussion'],
    confidence: 0.93,
  },
  {
    area: 'materials',
    target: {
      domain: 'design',
      subdomain: 'materials',
      key: 'hero_materials',
      label: 'Hero materials',
    },
    proposed_value: ['linen twill', 'washed cotton poplin', 'ramie voile'],
    rationale: 'Ramie adds the dry lustre and movement requested without breaking the natural-material logic.',
    evidence: ['Material note from the fitting photo', 'Supplier swatch reference discussed in the meeting'],
    confidence: 0.88,
  },
  {
    area: 'pricing',
    target: {
      domain: 'merchandising',
      subdomain: 'pricing',
      key: 'core_tier',
      label: 'Core price tier',
    },
    proposed_value: { min: 145, max: 205, currency: 'EUR' },
    rationale: 'A tighter band makes the wholesale story easier to buy while preserving the premium anchor.',
    evidence: ['Buyer threshold discussed explicitly in the meeting'],
    confidence: 0.96,
  },
  {
    area: 'calendar',
    target: {
      domain: 'design',
      subdomain: 'calendar',
      key: 'sample_rounds',
      label: 'Sample rounds',
    },
    proposed_value: 2,
    rationale: 'Remove the intermediate cosmetic round, retain fit and pre-production approvals, and protect the showroom date.',
    evidence: ['Calendar trade-off agreed in the meeting'],
    confidence: 0.91,
  },
];

const CHALLENGE_PRESENTATION: DraftCollectionRevisionArgs['presentation'] = {
  requested: true,
  audience: 'Wholesale buyer and collection director',
  objective: 'Explain the revised direction, commercial logic and calendar trade-off in one review.',
};

export type ChallengeScenarioId = 'meeting' | 'image' | 'audio' | 'instruction';

export interface ChallengeScenario {
  id: ChallengeScenarioId;
  label: string;
  headline: string;
  quote: string;
  input: DraftCollectionRevisionArgs;
}

function scenario(
  id: ChallengeScenarioId,
  label: string,
  headline: string,
  quote: string,
  source: DraftCollectionRevisionArgs['source'],
): ChallengeScenario {
  return {
    id,
    label,
    headline,
    quote,
    input: {
      source,
      changes: structuredClone(CHALLENGE_REVISION_CHANGES),
      presentation: CHALLENGE_PRESENTATION,
      idempotency_key: `webmcp-challenge-${id}-v1`,
    },
  };
}

export const CHALLENGE_SCENARIOS: Record<ChallengeScenarioId, ChallengeScenario> = {
  meeting: scenario(
    'meeting',
    'Meeting',
    'Wholesale review captured',
    '“Keep the precision, add warmth. Bring ramie into the hero materials, tighten the core price tier and protect the showroom date.”',
    {
      kind: 'meeting',
      title: 'Wholesale direction review',
      summary: 'The wholesale buyer asked for a warmer collection story, ramie as a hero material, a tighter core price tier and one fewer sample round to protect the showroom date.',
      references: [{
        label: 'Buyer meeting recap interpreted by the personal agent',
        reference: 'agent://meetings/wholesale-direction-review',
        original_file_saved: false,
      }],
    },
  ),
  image: scenario(
    'image',
    'Image',
    'Fitting image interpreted',
    '“Look 07 has the right precision, but the surface feels too cool. Use the dry lustre in this reference to warm the whole collection story.”',
    {
      kind: 'photo',
      title: 'Fitting image, look 07',
      summary: 'The personal agent interpreted a fitting image as evidence for warmer tactility, ramie voile and a more concentrated commercial offer while preserving the showroom date.',
      references: [{
        label: 'Fitting image interpreted by the personal agent',
        reference: 'agent://attachments/fitting-look-07',
        original_file_saved: false,
      }],
    },
  ),
  audio: scenario(
    'audio',
    'Audio',
    'Voice note interpreted',
    '“I want more emotion without losing discipline. Add ramie, focus the price architecture and remove the cosmetic sample round.”',
    {
      kind: 'audio',
      title: '03:18 collection voice note',
      summary: 'The personal agent transcribed a collection director voice note requesting warmer tactility, ramie, a tighter core price tier and a protected showroom date.',
      references: [{
        label: '03:18 voice note interpreted by the personal agent',
        reference: 'agent://attachments/collection-direction-audio',
        original_file_saved: false,
      }],
    },
  ),
  instruction: scenario(
    'instruction',
    'Instruction',
    'Agent instruction received',
    '“Prepare a governed review for Asteria SS27. Show every affected decision, uncertainty and commercial consequence before asking me to approve anything.”',
    {
      kind: 'agent_context',
      title: 'Personal agent instruction',
      summary: 'The personal agent supplied a bounded instruction to prepare a governed Asteria SS27 revision with evidence, consequences and mandatory human approval.',
      references: [{
        label: 'Instruction from the current agent conversation',
        reference: 'agent://conversations/current/instruction',
        original_file_saved: false,
      }],
    },
  ),
};

export const CHALLENGE_REVISION_INPUT = CHALLENGE_SCENARIOS.meeting.input;

export const CHALLENGE_CONTEXT = {
  collection: CHALLENGE_COLLECTION,
  playbook: {
    position: 'Creative direction aligned, assortment definition in progress',
    nextDecision: 'Validate the revision before the range architecture is locked',
  },
  decisions: CHALLENGE_CONTEXT_GRAPH.map((item) => ({
    domain: item.domain,
    subdomain: item.subdomain,
    key: item.key,
    value: item.value,
    rationale: item.rationale,
    confidence: item.confidence,
  })),
};
