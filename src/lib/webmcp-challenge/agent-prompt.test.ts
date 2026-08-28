import { describe, expect, it } from 'vitest';
import { getChallengeAgentPrompt } from './agent-prompt';

describe('WebMCP Challenge agent prompts', () => {
  it('stops the initial journey at the human approval boundary', () => {
    const prompt = getChallengeAgentPrompt('context_ready');

    expect(prompt).toMatch(/Site Tools/);
    expect(prompt).toMatch(/untrusted evidence/);
    expect(prompt).toMatch(/Do not approve or apply anything/);
    expect(prompt).toMatch(/exact artifact hash/);
  });

  it('keeps the draft review prompt read-only', () => {
    const prompt = getChallengeAgentPrompt('draft_ready');

    expect(prompt).toMatch(/inspect the current governed revision/);
    expect(prompt).toMatch(/both unselected alternatives/);
    expect(prompt).toMatch(/Do not approve or apply anything/);
  });

  it('binds completion to the already approved artifact', () => {
    const prompt = getChallengeAgentPrompt('approved');

    expect(prompt).toMatch(/exact human-approved artifact/);
    expect(prompt).toMatch(/apply only that approved revision/);
    expect(prompt).toMatch(/Do not undo until I ask/);
  });

  it('makes recovery explicit only while the preview is applied', () => {
    expect(getChallengeAgentPrompt('preview_applied')).toMatch(/undo the isolated preview/);
    expect(getChallengeAgentPrompt('preview_reverted')).toMatch(/Do not draft or apply another revision/);
  });
});
