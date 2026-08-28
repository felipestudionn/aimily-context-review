export interface Decision {
  id: string;
  collection_plan_id: string;
  domain: string;
  subdomain: string;
  key: string;
  value: unknown;
  value_type: string;
  rationale: string | null;
  confidence: 'suggested' | 'draft' | 'confirmed' | 'approved' | 'locked';
  source: 'user_input' | 'ai_recommendation' | 'import' | 'calculation' | 'inherited';
  source_phase: string;
  source_component: string | null;
  version: number;
  is_current: boolean;
  decided_by: string | null;
  decided_at: string;
  tags: string[];
}
