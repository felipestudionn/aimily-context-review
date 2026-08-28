'use client';

import { ArrowRight, GitBranch, LockKeyhole, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CollectionRevisionImpact, RevisionImpactEvidenceKind } from '@/lib/domain/collection-creation/impact';

const EVIDENCE_STYLE: Record<RevisionImpactEvidenceKind, string> = {
  source: 'bg-white/10 text-white/55',
  explicit: 'bg-moss/70 text-carbon',
  computed: 'bg-citronella text-carbon',
  inference: 'border border-white/15 bg-transparent text-white/50',
  policy: 'bg-white text-carbon',
};

export function ContextImpactGraph({
  impact,
  focusedTarget,
  onFocus,
}: {
  impact: CollectionRevisionImpact;
  focusedTarget: string | null;
  onFocus: (target: string) => void;
}) {
  const source = impact.nodes.find((node) => node.kind === 'source');
  const decisions = impact.nodes.filter((node) => node.kind === 'decision');
  const approval = impact.nodes.find((node) => node.kind === 'approval');
  const outcome = impact.nodes.find((node) => node.kind === 'outcome');
  const focused = decisions.find((node) => node.label === focusedTarget) ?? decisions[0];
  const consequences = focused
    ? impact.consequences.filter((item) => item.sourceNodeId === focused.id)
    : [];

  return (
    <section className="@container mt-7 rounded-[20px] bg-[#101716] px-5 py-6 text-white md:px-7" data-testid="context-impact-graph">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/32">Context Graph · impact map</p>
          <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.04em]">One signal, every governed consequence.</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="h-7 rounded-full bg-white/10 px-3 text-[9px] text-white/55">
            {impact.summary.changedDecisions} decisions
          </Badge>
          <Badge className="h-7 rounded-full bg-white/10 px-3 text-[9px] text-white/55">
            {impact.summary.affectedAreas.length} affected areas
          </Badge>
          <Badge className="h-7 rounded-full bg-moss/75 px-3 text-[9px] text-carbon">
            {Math.round(impact.summary.averageConfidence * 100)}% avg confidence
          </Badge>
        </div>
      </div>

      <div className="mt-6 grid items-center gap-3 @min-[760px]:grid-cols-[minmax(130px,0.62fr)_24px_minmax(0,2fr)_24px_minmax(145px,0.72fr)]">
        <div className="rounded-[16px] border border-white/10 bg-white/[0.05] p-4">
          <Sparkles className="h-4 w-4 text-white/40" aria-hidden />
          <p className="mt-4 text-[9px] font-medium uppercase tracking-[0.12em] text-white/28">Untrusted source</p>
          <p className="mt-1 text-[11px] font-semibold leading-tight">{source?.label}</p>
        </div>
        <ArrowRight className="mx-auto hidden h-4 w-4 text-white/18 @min-[760px]:block" aria-hidden />
        <div className="grid gap-2 sm:grid-cols-2">
          {decisions.map((node) => (
            <Button
              key={node.id}
              variant="outline"
              className={`h-auto min-h-[74px] min-w-0 justify-start whitespace-normal rounded-[14px] border px-4 py-3 text-left text-white transition-colors ${focused?.id === node.id ? 'border-moss/70 bg-moss/15 hover:bg-moss/20' : 'border-white/10 bg-white/[0.035] hover:bg-white/[0.07]'}`}
              onClick={() => onFocus(node.label)}
              aria-pressed={focused?.id === node.id}
            >
              <span className="block min-w-0">
                <span className="block text-[8px] font-medium uppercase tracking-[0.11em] text-white/28">{node.area.replaceAll('_', ' ')}</span>
                <span className="mt-1 block text-[11px] font-semibold leading-[1.2] tracking-[-0.02em]">{node.label}</span>
                <span className="mt-1 block text-[9px] text-white/32">{Math.round((node.confidence ?? 0) * 100)}% confidence</span>
              </span>
            </Button>
          ))}
        </div>
        <ArrowRight className="mx-auto hidden h-4 w-4 text-white/18 @min-[760px]:block" aria-hidden />
        <div className="space-y-2">
          <div className="rounded-[14px] bg-white p-4 text-carbon">
            <LockKeyhole className="h-3.5 w-3.5 text-carbon/35" aria-hidden />
            <p className="mt-3 text-[9px] font-medium uppercase tracking-[0.11em] text-carbon/30">Policy gate</p>
            <p className="mt-1 text-[11px] font-semibold">{approval?.label}</p>
          </div>
          {outcome && (
            <div className="rounded-[14px] border border-white/10 bg-white/[0.05] p-4">
              <GitBranch className="h-3.5 w-3.5 text-white/35" aria-hidden />
              <p className="mt-3 text-[9px] font-medium uppercase tracking-[0.11em] text-white/28">Pending outcome</p>
              <p className="mt-1 text-[11px] font-semibold">{outcome.label}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-5 border-t border-white/10 pt-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-white/28">Focused consequence · {focused?.label}</p>
          <div className="mt-3 space-y-2">
            {consequences.map((item) => (
              <div key={item.id} className="rounded-[14px] border border-white/10 bg-white/[0.035] p-4">
                <Badge className={`h-6 rounded-full px-2.5 text-[8px] uppercase tracking-[0.08em] ${EVIDENCE_STYLE[item.evidenceKind]}`}>
                  {item.evidenceKind}
                </Badge>
                <p className="mt-2 text-[11px] leading-[1.55] text-white/65">{item.statement}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-white/28">Bounded alternatives · none selected</p>
          <div className="mt-3 space-y-2">
            {impact.alternatives.map((alternative) => (
              <div key={alternative.id} className="rounded-[14px] border border-white/10 bg-white/[0.035] p-4">
                <p className="text-[11px] font-semibold">{alternative.label}</p>
                <p className="mt-1 text-[9px] leading-[1.5] text-white/38">{alternative.summary}</p>
                <p className="mt-2 text-[8px] uppercase tracking-[0.08em] text-white/24">Trade-off · {alternative.tradeoffs.join(' · ')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
