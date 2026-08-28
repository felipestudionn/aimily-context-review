import { CheckCircle2, FileCheck2, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CollectionRevisionBrief } from '@/lib/domain/collection-creation/brief';

function valueLabel(value: unknown): string {
  if (Array.isArray(value)) return value.join(' · ');
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if ('min' in record && 'max' in record) {
      return `${record.min}–${record.max} ${record.currency ?? ''}`.trim();
    }
    return JSON.stringify(value);
  }
  return String(value);
}

export function ApprovedReviewBrief({ brief }: { brief: CollectionRevisionBrief }) {
  return (
    <section className="mt-7 overflow-hidden rounded-[20px] bg-[#e9edcf]" data-testid="approved-review-brief">
      <div className="grid gap-7 px-6 py-7 md:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)] md:px-8">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="h-7 rounded-full bg-carbon px-3 text-[9px] font-semibold uppercase tracking-[0.1em] text-white">
              Unlocked by human approval
            </Badge>
            <Badge variant="outline" className="h-7 rounded-full border-carbon/10 bg-white/45 px-3 text-[9px] text-carbon/45">
              Buyer-ready artifact
            </Badge>
          </div>
          <h3 className="mt-5 text-[27px] font-semibold leading-[1.02] tracking-[-0.045em] text-carbon">{brief.title}</h3>
          <p className="mt-4 max-w-[760px] text-[12px] leading-[1.65] text-carbon/55">{brief.executiveSummary}</p>
        </div>
        <div className="rounded-[16px] border border-carbon/[0.07] bg-white/55 p-5">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-carbon/60">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Exact artifact binding
          </div>
          <p className="mt-3 break-all font-mono text-[9px] leading-[1.5] text-carbon/40">{brief.artifactHash}</p>
          <p className="mt-3 text-[9px] leading-[1.5] text-carbon/42">{brief.evidenceNotice}</p>
        </div>
      </div>

      <div className="grid gap-px border-y border-carbon/[0.07] bg-carbon/[0.07] sm:grid-cols-2 xl:grid-cols-4">
        {brief.decisionHighlights.map((item, index) => (
          <div key={item.target} className="bg-[#f3f5df] px-6 py-6">
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-carbon/28">0{index + 1} · {item.area.replaceAll('_', ' ')}</p>
            <p className="mt-2 text-[12px] font-semibold tracking-[-0.025em]">{item.target}</p>
            <p className="mt-3 text-[10px] leading-[1.5] text-carbon/40">{valueLabel(item.before)} → <span className="font-semibold text-carbon/70">{valueLabel(item.after)}</span></p>
            <div className="mt-4 flex items-center gap-2 text-[9px] text-carbon/35">
              <CheckCircle2 className="h-3 w-3" aria-hidden /> {Math.round(item.confidence * 100)}% confidence
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col justify-between gap-4 px-6 py-5 md:flex-row md:items-center md:px-8">
        <div className="flex items-start gap-3">
          <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-carbon/40" aria-hidden />
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.11em] text-carbon/28">Next governed step</p>
            <p className="mt-1 text-[10px] leading-[1.5] text-carbon/50">{brief.nextStep}</p>
          </div>
        </div>
        <p className="shrink-0 text-[9px] font-semibold text-carbon/35">{brief.audience}</p>
      </div>
    </section>
  );
}
