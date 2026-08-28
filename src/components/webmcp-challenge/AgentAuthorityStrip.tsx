'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, Copy, LockKeyhole, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { WebMcpRegistrationStatus } from '@/lib/webmcp/types';
import type { ChallengeWebMcpTool } from '@/lib/webmcp/challenge-tools';
import {
  CHALLENGE_AGENT_PROMPT_LABELS,
  getChallengeAgentPrompt,
} from '@/lib/webmcp-challenge/agent-prompt';
import type { ChallengeStage } from '@/lib/webmcp-challenge/types';

const AUTHORITY_COPY: Record<ChallengeStage, string> = {
  context_ready: 'Draft can create a review artifact. It cannot change collection truth.',
  draft_ready: 'Apply remains absent until a human approves this exact artifact hash.',
  approved: 'Apply is available now, but only for the exact hash the human approved.',
  preview_applied: 'Apply is gone. Recovery is now the only mutating capability.',
  preview_reverted: 'Recovery is complete. Undo is gone and drafting is available again.',
};

export function AgentAuthorityStrip({
  stage,
  status,
  tools,
}: {
  stage: ChallengeStage;
  status: WebMcpRegistrationStatus;
  tools: ChallengeWebMcpTool[];
}) {
  const ready = status === 'ready';
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  useEffect(() => setCopyStatus('idle'), [stage]);

  const fallbackCopy = (value: string): boolean => {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  };

  const copyPrompt = async () => {
    const prompt = getChallengeAgentPrompt(stage);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(prompt);
      } else if (!fallbackCopy(prompt)) {
        throw new Error('Clipboard unavailable.');
      }
      setCopyStatus('copied');
    } catch {
      setCopyStatus(fallbackCopy(prompt) ? 'copied' : 'error');
    }
  };

  return (
    <section
      className="mb-5 rounded-[20px] border border-carbon/[0.06] bg-white px-5 py-4 md:px-6"
      data-testid="agent-authority-strip"
      aria-label="Current WebMCP authority boundary"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-carbon/35" aria-hidden />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-semibold tracking-[-0.02em]">Live authority boundary</p>
              <span className={`h-2 w-2 rounded-full ${ready ? 'bg-emerald-500' : 'bg-carbon/20'}`} aria-hidden />
              <span className="text-[11px] text-carbon/50">
                {ready
                  ? `${tools.length} page-scoped tools available now`
                  : `${tools.length} page-scoped intents defined for this state`}
              </span>
            </div>
            <p className="mt-1 text-[10px] leading-[1.5] text-carbon/35">
              Generated from the exact <code className="font-mono">document.modelContext</code> registration, not a separate capability list.
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-wrap gap-2 xl:justify-center" data-testid="agent-authority-tools">
          {tools.map((tool) => (
            <Badge
              key={tool.name}
              variant="outline"
              className="h-7 rounded-full border-carbon/[0.08] bg-carbon/[0.025] px-3 text-[9px] font-medium text-carbon/55"
              data-webmcp-tool-name={tool.name}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${tool.annotations.readOnlyHint ? 'bg-carbon/25' : 'bg-[#66704b]'}`} aria-hidden />
              <span className="font-mono">{tool.name}</span>
              <span className="text-carbon/25">{tool.annotations.readOnlyHint ? 'read' : 'act'}</span>
            </Badge>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3 rounded-[16px] bg-shade px-4 py-3">
          <LockKeyhole className="h-4 w-4 shrink-0 text-carbon/35" aria-hidden />
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-carbon/30">Human-only authority</p>
            <p className="mt-0.5 text-[11px] font-semibold">Approve exact artifact hash</p>
          </div>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-carbon/20" aria-hidden />
          <p className="hidden max-w-[250px] text-[10px] leading-[1.45] text-carbon/38 2xl:block">{AUTHORITY_COPY[stage]}</p>
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-[1.5] text-carbon/38 xl:hidden">{AUTHORITY_COPY[stage]}</p>
      <div className="mt-4 flex flex-col gap-3 border-t border-carbon/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[-0.01em] text-carbon/55">Run this state with your personal agent</p>
          <p className="mt-0.5 text-[10px] leading-[1.5] text-carbon/35">The prompt follows the live authority boundary and stops before the next human-only decision.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 shrink-0 rounded-full border-carbon/[0.1] bg-white px-4 text-[10px] font-semibold text-carbon/60 hover:bg-carbon/[0.03]"
          onClick={() => void copyPrompt()}
          data-testid="agent-prompt-launcher"
          data-agent-prompt-stage={stage}
          aria-live="polite"
        >
          {copyStatus === 'copied' ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          {copyStatus === 'copied'
            ? 'Prompt copied'
            : copyStatus === 'error'
              ? 'Copy unavailable'
              : CHALLENGE_AGENT_PROMPT_LABELS[stage]}
        </Button>
      </div>
    </section>
  );
}
