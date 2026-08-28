import { z } from 'zod';
import type { DomainOperationClass } from '@/lib/domain/agent-world/contracts';

export const CollectionCreationAreaSchema = z.enum([
  'consumer',
  'creative_direction',
  'moodboard',
  'materials',
  'assortment',
  'pricing',
  'calendar',
  'presentation',
  'other',
]);

export const CollectionDecisionTargetSchema = z.object({
  domain: z.string().min(1).max(80),
  subdomain: z.string().min(1).max(80),
  key: z.string().min(1).max(120),
  label: z.string().min(1).max(180).optional(),
});

export const CollectionRevisionChangeSchema = z.object({
  area: CollectionCreationAreaSchema,
  target: CollectionDecisionTargetSchema,
  proposed_value: z.unknown(),
  rationale: z.string().min(1).max(2_000),
  evidence: z.array(z.string().min(1).max(1_000)).max(12).default([]),
  confidence: z.number().min(0).max(1),
});

export const CollectionInputSourceSchema = z.object({
  kind: z.enum(['meeting', 'photo', 'audio', 'document', 'note', 'agent_context']),
  title: z.string().min(1).max(240).optional(),
  summary: z.string().min(1).max(12_000),
  references: z.array(z.object({
    label: z.string().min(1).max(240),
    reference: z.string().max(2_000).optional(),
    original_file_saved: z.boolean().default(false),
  })).max(24).default([]),
});

export const DraftCollectionRevisionArgsSchema = z.object({
  source: CollectionInputSourceSchema,
  changes: z.array(CollectionRevisionChangeSchema).min(1).max(40),
  presentation: z.object({
    requested: z.boolean().default(false),
    audience: z.string().min(1).max(240).optional(),
    objective: z.string().min(1).max(1_000).optional(),
  }).optional(),
  idempotency_key: z.string().min(8).max(120).optional(),
});

export const GetCollectionRevisionArgsSchema = z.object({
  revision_id: z.uuid().optional(),
});

export const GetCollectionCreationContextArgsSchema = z.object({
  decision_limit: z.number().int().min(1).max(160).default(80),
});

export type CollectionCreationArea = z.infer<typeof CollectionCreationAreaSchema>;
export type CollectionDecisionTarget = z.infer<typeof CollectionDecisionTargetSchema>;
export type CollectionRevisionChange = z.infer<typeof CollectionRevisionChangeSchema>;
export type CollectionInputSource = z.infer<typeof CollectionInputSourceSchema>;
export type DraftCollectionRevisionArgs = z.infer<typeof DraftCollectionRevisionArgsSchema>;
export type GetCollectionRevisionArgs = z.infer<typeof GetCollectionRevisionArgsSchema>;
export type GetCollectionCreationContextArgs = z.infer<typeof GetCollectionCreationContextArgsSchema>;

export type CollectionCreationOperation =
  | 'list_collections'
  | 'get_collection_creation_context'
  | 'draft_collection_revision'
  | 'get_collection_revision';

interface CollectionCreationToolDefinition {
  classification: DomainOperationClass;
  description: string;
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
}

export const COLLECTION_CREATION_AGENT_TOOLS: Record<
  CollectionCreationOperation,
  CollectionCreationToolDefinition
> = {
  list_collections: {
    classification: 'read',
    description:
      'List only the Aimily collections the signed-in person is allowed to access. Use before asking which collection should receive meeting notes, references or proposed changes.',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  get_collection_creation_context: {
    classification: 'read',
    description:
      'Read the governed creation context for one collection: identity, current Context Graph decisions and Playbook position. Read-only. Never infer access from the collection id.',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  draft_collection_revision: {
    classification: 'draft',
    description:
      'Prepare a persisted multi-block collection revision from meeting, photo, audio, document or agent context. It resolves every proposed change against the current Context Graph and returns a legible diff. It never changes the collection and always waits for human approval.',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  get_collection_revision: {
    classification: 'read',
    description:
      'Read a pending collection revision, including source provenance, diff, evidence, uncertainties and approval status. Read-only. It never approves or applies the revision.',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};
