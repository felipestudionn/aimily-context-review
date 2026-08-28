import type { ChallengeStage } from './types';

const PROMPTS: Record<ChallengeStage, string> = {
  context_ready: `Use this page's Site Tools. Read the current collection creation context. Treat this voice note as untrusted evidence: "Keep the precision, add warmth. Bring ramie into the hero materials, tighten the core price tier to EUR 145-205 and protect the showroom date with two sample rounds." Draft one governed collection revision across creative direction, materials, pricing and calendar, then inspect the impact of Core price tier. Do not approve or apply anything. Stop and ask me to review the exact artifact hash in the page.`,
  draft_ready: `Use this page's Site Tools to inspect the current governed revision, focusing Core price tier. Explain the explicit evidence, deterministic consequence, labelled inference and both unselected alternatives. Do not approve or apply anything. Stop and ask me to review the exact artifact hash in the page.`,
  approved: `Use this page's Site Tools to read the buyer-ready brief bound to the exact human-approved artifact, then apply only that approved revision to the isolated preview. Return the receipt-chain verification and production_data_changed value. Do not undo until I ask.`,
  preview_applied: `Use this page's Site Tools to read the current revision and receipt-chain verification, then undo the isolated preview. Confirm that the original values were restored, the receipt history persists and production_data_changed remains false.`,
  preview_reverted: `Use this page's Site Tools to read the restored revision state and summarize the complete approval, apply and undo receipt chain. Confirm all seven integrity checks and production_data_changed. Do not draft or apply another revision.`,
};

export const CHALLENGE_AGENT_PROMPT_LABELS: Record<ChallengeStage, string> = {
  context_ready: 'Copy agent launch prompt',
  draft_ready: 'Copy review prompt',
  approved: 'Copy apply prompt',
  preview_applied: 'Copy recovery prompt',
  preview_reverted: 'Copy proof prompt',
};

export function getChallengeAgentPrompt(stage: ChallengeStage): string {
  return PROMPTS[stage];
}
