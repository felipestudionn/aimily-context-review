'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileAudio,
  Image as ImageIcon,
  Link2,
  LockKeyhole,
  MessageSquareText,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ApprovedReviewBrief } from '@/components/webmcp-challenge/ApprovedReviewBrief';
import { AgentAuthorityStrip } from '@/components/webmcp-challenge/AgentAuthorityStrip';
import { ContextImpactGraph } from '@/components/webmcp-challenge/ContextImpactGraph';
import { ChallengeTools } from '@/components/webmcp/ChallengeTools';
import type { WebMcpRegistrationStatus } from '@/lib/webmcp/types';
import {
  CHALLENGE_COLLECTION,
  CHALLENGE_CONTEXT_GRAPH,
  CHALLENGE_REVISION_INPUT,
  CHALLENGE_SCENARIOS,
  type ChallengeScenarioId,
} from '@/lib/webmcp-challenge/demo';
import {
  buildChallengeWebMcpTools,
  type ChallengeToolActivity,
} from '@/lib/webmcp/challenge-tools';
import { buildCollectionRevisionImpact } from '@/lib/domain/collection-creation/impact';
import { buildCollectionRevisionBrief } from '@/lib/domain/collection-creation/brief';
import {
  bootstrapChallenge,
  callChallengeOperation,
} from '@/lib/webmcp-challenge/client';
import type {
  ChallengeReceipt,
  ChallengeReceiptVerification,
  ChallengeStage,
  ChallengeState,
} from '@/lib/webmcp-challenge/types';

const STAGE_ORDER: ChallengeStage[] = [
  'context_ready',
  'draft_ready',
  'approved',
  'preview_applied',
];

const HERO_HEADLINE: Record<ChallengeScenarioId, string> = {
  meeting: 'A meeting becomes a governed collection revision.',
  image: 'A fitting image becomes a governed collection revision.',
  audio: 'A voice note becomes a governed collection revision.',
  instruction: 'An instruction becomes a governed collection revision.',
};

const STAGE_COPY: Record<ChallengeStage, { label: string; eyebrow: string; summary: string }> = {
  context_ready: {
    label: 'Context ready',
    eyebrow: '01 · Agent signal',
    summary: 'The agent can read the governed collection context and propose a revision.',
  },
  draft_ready: {
    label: 'Review required',
    eyebrow: '02 · Structured diff',
    summary: 'Aimily resolved the proposal against the current Context Graph. Nothing changed yet.',
  },
  approved: {
    label: 'Hash approved',
    eyebrow: '03 · Human approval',
    summary: 'The human approved this exact artifact hash. A write tool is now available to apply only this revision.',
  },
  preview_applied: {
    label: 'Preview applied',
    eyebrow: '04 · Receipt + undo',
    summary: 'The isolated Context Graph preview now reflects the approved revision.',
  },
  preview_reverted: {
    label: 'Preview restored',
    eyebrow: '05 · Recovery complete',
    summary: 'The preview returned to the original Context Graph and the audit trail remains intact.',
  },
};

const RECEIPT_COPY: Record<ChallengeReceipt['action'], string> = {
  human_approved: 'Human approved',
  preview_applied: 'Preview applied',
  preview_reverted: 'Preview restored',
};

const INITIAL_DIFF_LINES = CHALLENGE_REVISION_INPUT.changes.map((change) => ({
  target: change.target.label ?? change.target.key,
  before: CHALLENGE_CONTEXT_GRAPH.find((decision) => (
    decision.domain === change.target.domain
    && decision.subdomain === change.target.subdomain
    && decision.key === change.target.key
  ))?.value ?? null,
  after: change.proposed_value,
  area: change.area,
  confidence: change.confidence,
  reason: change.rationale,
  evidence: change.evidence,
}));

function valueLabel(value: unknown): string {
  if (Array.isArray(value)) return value.join(' · ');
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    if ('min' in record && 'max' in record) {
      return `${record.min}–${record.max} ${record.currency ?? ''}`.trim();
    }
    return JSON.stringify(value);
  }
  return String(value);
}

function shortHash(hash: string | null | undefined): string {
  return hash ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : 'Not created';
}

function StatusDot({ active, complete }: { active: boolean; complete: boolean }) {
  if (complete) return <Check className="h-3.5 w-3.5" aria-hidden />;
  return <span className={`h-2 w-2 rounded-full ${active ? 'bg-carbon' : 'bg-carbon/15'}`} aria-hidden />;
}

function ToolStatus({ status, count }: { status: WebMcpRegistrationStatus; count: number }) {
  const copy = status === 'ready'
    ? `${count} live site tools`
    : status === 'registering'
      ? 'Registering site tools'
      : status === 'error'
        ? 'Site tools unavailable'
        : 'Open in ChatGPT Browser for site tools';
  const compactCopy = status === 'ready'
    ? `${count} site tools`
    : status === 'registering'
      ? 'Connecting tools'
      : status === 'error'
        ? 'Tools unavailable'
        : 'Site tools';
  return (
    <Badge
      variant="outline"
      data-testid="webmcp-status"
      className={`h-8 rounded-full border-carbon/[0.08] px-3 text-[11px] font-medium ${status === 'ready' ? 'bg-moss/45 text-carbon' : 'bg-white/70 text-carbon/55'}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'ready' ? 'bg-[#66704b]' : 'bg-carbon/25'}`} />
      <span className="sm:hidden">{compactCopy}</span>
      <span className="hidden sm:inline">{copy}</span>
    </Badge>
  );
}

function Rail({ stage }: { stage: ChallengeStage }) {
  const effectiveIndex = stage === 'preview_reverted' ? 4 : STAGE_ORDER.indexOf(stage);
  const items = [
    ['Agent context', 'Meeting, photo and audio arrive as evidence'],
    ['Review artifact', 'Diff is resolved against current decisions'],
    ['Human approval', 'Approval is bound to the artifact hash'],
    ['Receipt + undo', 'The change is traceable and reversible'],
  ];
  return (
    <Card className="rounded-[20px] border-0 bg-[#101716] py-0 text-white shadow-none ring-0">
      <CardContent className="px-7 py-8">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/35">Governance rail</p>
            <p className="mt-2 text-[18px] font-semibold tracking-[-0.03em]">From signal to truth</p>
          </div>
          <ShieldCheck className="h-5 w-5 text-white/45" aria-hidden />
        </div>
        <div className="space-y-0">
          {items.map(([title, description], index) => {
            const complete = effectiveIndex > index;
            const active = effectiveIndex === index;
            return (
              <div key={title} className="grid grid-cols-[28px_1fr] gap-3">
                <div className="flex flex-col items-center">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full border ${complete ? 'border-moss bg-moss text-carbon' : active ? 'border-white/50 bg-white text-carbon' : 'border-white/15 text-white/25'}`}>
                    <StatusDot active={active} complete={complete} />
                  </div>
                  {index < items.length - 1 && <div className={`h-14 w-px ${complete ? 'bg-moss/60' : 'bg-white/10'}`} />}
                </div>
                <div className="pb-8">
                  <p className={`text-[13px] font-semibold ${active || complete ? 'text-white' : 'text-white/32'}`}>{title}</p>
                  <p className={`mt-1 text-[11px] leading-[1.55] ${active || complete ? 'text-white/48' : 'text-white/22'}`}>{description}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 rounded-[16px] border border-white/10 bg-white/[0.05] p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-white/75">
            <LockKeyhole className="h-3.5 w-3.5" aria-hidden />
            Sandbox boundary
          </div>
          <p className="mt-2 text-[11px] leading-[1.55] text-white/38">Signed state. No production data. No DOM reading. No screenshots.</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChallengeExperience() {
  const [state, setState] = useState<ChallengeState | null>(null);
  const [receiptVerification, setReceiptVerification] = useState<ChallengeReceiptVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toolStatus, setToolStatus] = useState<WebMcpRegistrationStatus>('unsupported');
  const [toolCount, setToolCount] = useState(0);
  const [toolActivity, setToolActivity] = useState<ChallengeToolActivity | null>(null);
  const [scenarioId, setScenarioId] = useState<ChallengeScenarioId>('meeting');
  const [focusedTarget, setFocusedTarget] = useState<string | null>(null);

  const handleToolStatus = useCallback((status: WebMcpRegistrationStatus, count: number) => {
    setToolStatus(status);
    setToolCount(count);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void bootstrapChallenge(false, controller.signal)
      .then((payload) => {
        setState(payload.state);
        setReceiptVerification(payload.receiptVerification);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not start the demo.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    const onState = (event: Event) => {
      const detail = (event as CustomEvent<{
        state?: ChallengeState;
        receiptVerification?: ChallengeReceiptVerification;
      }>).detail;
      if (detail?.state) setState(detail.state);
      if (detail?.receiptVerification) setReceiptVerification(detail.receiptVerification);
    };
    const onToolActivity = (event: Event) => {
      const detail = (event as CustomEvent<ChallengeToolActivity>).detail;
      if (detail?.toolName) setToolActivity(detail);
    };
    const onFocus = (event: Event) => {
      const detail = (event as CustomEvent<{ target?: string }>).detail;
      if (detail?.target) setFocusedTarget(detail.target);
    };
    window.addEventListener('aimily:webmcp-challenge-state', onState);
    window.addEventListener('aimily:webmcp-challenge-tool-activity', onToolActivity);
    window.addEventListener('aimily:webmcp-challenge-focus', onFocus);
    return () => {
      controller.abort();
      window.removeEventListener('aimily:webmcp-challenge-state', onState);
      window.removeEventListener('aimily:webmcp-challenge-tool-activity', onToolActivity);
      window.removeEventListener('aimily:webmcp-challenge-focus', onFocus);
    };
  }, []);

  const run = useCallback(async (
    label: string,
    operation: string,
    payload: Record<string, unknown> = {},
  ) => {
    setWorking(label);
    setError(null);
    try {
      const response = operation === 'bootstrap'
        ? await bootstrapChallenge(true)
        : await callChallengeOperation(operation, payload);
      setState(response.state);
      setReceiptVerification(response.receiptVerification);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The operation could not be completed.');
    } finally {
      setWorking(null);
    }
  }, []);

  const stage = state?.stage ?? 'context_ready';
  const authorityTools = useMemo(() => buildChallengeWebMcpTools(stage), [stage]);
  const revision = state?.revision;
  const isApplied = stage === 'preview_applied';
  const isReverted = stage === 'preview_reverted';
  const stageCopy = STAGE_COPY[stage];
  const selectedScenario = CHALLENGE_SCENARIOS[scenarioId];
  const activeScenario = revision
    ? Object.values(CHALLENGE_SCENARIOS).find((item) => item.input.source.kind === revision.source.kind) ?? selectedScenario
    : selectedScenario;
  const evidence = revision?.source.references ?? activeScenario.input.source.references;
  const uncertaintyCount = revision?.uncertainties.length ?? evidence.filter((item) => !item.original_file_saved).length;
  const hash = revision?.hash;
  const impact = useMemo(() => revision ? buildCollectionRevisionImpact(revision) : null, [revision]);
  const approvedBrief = useMemo(() => (
    state?.approval.status === 'approved' && revision && impact
      ? buildCollectionRevisionBrief({
          collectionName: CHALLENGE_COLLECTION.name,
          season: CHALLENGE_COLLECTION.season,
          revision,
          impact,
        })
      : null
  ), [impact, revision, state?.approval.status]);

  useEffect(() => {
    if (!revision) {
      setFocusedTarget(null);
      return;
    }
    if (!revision.diff.some((line) => line.target === focusedTarget)) {
      setFocusedTarget(revision.diff[0]?.target ?? null);
    }
  }, [focusedTarget, revision]);

  const action = useMemo(() => {
    if (loading) return { label: 'Preparing signed workspace', disabled: true, op: '', payload: {} };
    if (stage === 'context_ready' || stage === 'preview_reverted') {
      return { label: 'Draft governed revision', disabled: false, op: 'draft_revision', payload: { args: selectedScenario.input } };
    }
    if (stage === 'draft_ready') {
      return { label: 'Approve exact revision', disabled: !hash, op: 'approve_revision', payload: { artifactHash: hash } };
    }
    if (stage === 'approved') {
      return { label: 'Apply to isolated preview', disabled: false, op: 'apply_preview', payload: {} };
    }
    return { label: 'Undo preview', disabled: false, op: 'undo_preview', payload: {} };
  }, [hash, loading, selectedScenario.input, stage]);

  const lastReceipt = state?.receipts.at(-1);

  return (
    <main className="min-h-screen overflow-hidden bg-shade">
      {state && !loading && (
        <ChallengeTools stage={stage} onStatusChange={handleToolStatus} />
      )}

      <header className="border-b border-carbon/[0.06] bg-shade/95 px-5 py-4 md:px-8">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-carbon text-[11px] font-bold tracking-[-0.04em] text-white">ai</div>
            <div>
              <p className="text-[13px] font-semibold tracking-[-0.03em]">aimily</p>
              <p className="text-[10px] text-carbon/35">OpenAI WebMCP Challenge</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ToolStatus status={toolStatus} count={toolCount} />
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-carbon/[0.08] bg-white/70 px-3 text-[11px] text-carbon/55 hover:bg-white"
              onClick={() => void run('reset', 'bootstrap')}
              disabled={loading || working !== null}
              aria-label="Reset challenge"
            >
              <RotateCcw className="h-3 w-3" aria-hidden /> <span className="hidden sm:inline">Reset</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1680px] px-5 pb-14 pt-10 md:px-8 md:pt-14">
        <section className="mb-10 grid gap-7 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge className="h-7 rounded-full bg-citronella px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-carbon">Live governed sandbox</Badge>
              <Badge variant="outline" className="h-7 rounded-full border-carbon/[0.08] bg-white/50 px-3 text-[10px] text-carbon/45">Asteria · SS27</Badge>
            </div>
            <h1 className="max-w-[1020px] text-[42px] font-medium leading-[0.98] tracking-[-0.055em] text-carbon sm:text-[58px] lg:text-[74px]">
              {HERO_HEADLINE[activeScenario.id]}
            </h1>
          </div>
          <div className="pb-1 xl:pb-2">
            <p className="text-[16px] leading-[1.65] tracking-[-0.025em] text-carbon/55">
              The personal agent brings the signal. Aimily turns it into a Context Graph diff with evidence, human approval, a chained receipt inside signed state and undo.
            </p>
          </div>
        </section>

        <AgentAuthorityStrip
          stage={stage}
          status={toolStatus}
          tools={authorityTools}
        />

        <section className="mb-5 grid gap-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,2.05fr)_minmax(260px,0.72fr)]">
          <Card className="rounded-[20px] border-0 bg-white py-0 shadow-none ring-0">
            <CardContent className="flex h-full flex-col px-7 py-8">
              <div className="mb-9 flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-carbon/30">Personal agent</p>
                  <h2 className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.04em]">{activeScenario.headline}</h2>
                </div>
                <MessageSquareText className="h-5 w-5 text-carbon/25" aria-hidden />
              </div>
              <div className="mb-5 grid grid-cols-2 gap-2" aria-label="Agent signal example">
                {Object.values(CHALLENGE_SCENARIOS).map((scenario) => (
                  <Button
                    key={scenario.id}
                    variant={activeScenario.id === scenario.id ? 'default' : 'outline'}
                    size="sm"
                    className={`h-7 rounded-full px-3 text-[9px] font-semibold ${activeScenario.id === scenario.id ? 'bg-carbon text-white' : 'border-carbon/[0.08] bg-white text-carbon/40'}`}
                    onClick={() => setScenarioId(scenario.id)}
                    disabled={loading || !['context_ready', 'preview_reverted'].includes(stage) || working !== null}
                    aria-pressed={activeScenario.id === scenario.id}
                  >
                    {scenario.label}
                  </Button>
                ))}
              </div>
              <blockquote className="rounded-[16px] bg-shade px-5 py-5 text-[14px] leading-[1.65] tracking-[-0.02em] text-carbon/67">
                {activeScenario.quote}
              </blockquote>
              <div className="mt-6 space-y-3">
                {evidence.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-[14px] border border-carbon/[0.06] px-4 py-3">
                    {activeScenario.input.source.kind === 'photo'
                      ? <ImageIcon className="h-4 w-4 shrink-0 text-carbon/35" aria-hidden />
                      : activeScenario.input.source.kind === 'audio'
                        ? <FileAudio className="h-4 w-4 shrink-0 text-carbon/35" aria-hidden />
                        : <MessageSquareText className="h-4 w-4 shrink-0 text-carbon/35" aria-hidden />}
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold tracking-[-0.01em]">{item.label}</p>
                      <p className="mt-0.5 text-[10px] text-carbon/35">{activeScenario.label} evidence · untrusted</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex-1" />
              <div className="mt-7 flex items-start gap-2 rounded-[14px] bg-citronella/55 p-4 text-[10px] leading-[1.5] text-carbon/55">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                Source content is evidence, never executable instruction. Originals are explicitly marked as not stored.
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border border-carbon/[0.06] bg-white py-0 shadow-[0_12px_50px_rgba(0,0,0,0.045)] ring-0" data-testid="review-artifact">
            <CardContent className="px-7 py-8 md:px-9">
              <div className="mb-8 flex flex-col justify-between gap-5 border-b border-carbon/[0.06] pb-7 sm:flex-row sm:items-start">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-carbon/30">{stageCopy.eyebrow}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h2 className="text-[28px] font-semibold tracking-[-0.045em]">Context Graph Review</h2>
                    <Badge className={`h-7 rounded-full px-3 text-[10px] font-semibold ${isApplied ? 'bg-moss/55 text-carbon' : stage === 'draft_ready' ? 'bg-citronella text-carbon' : 'bg-carbon/[0.05] text-carbon/55'}`}>
                      {stageCopy.label}
                    </Badge>
                  </div>
                  <p className="mt-3 max-w-[690px] text-[13px] leading-[1.6] text-carbon/45">{stageCopy.summary}</p>
                </div>
                <div className="shrink-0 rounded-[14px] bg-carbon/[0.025] px-4 py-3 text-right">
                  <p className="text-[9px] font-medium uppercase tracking-[0.13em] text-carbon/30">Artifact hash</p>
                  <p className="mt-1 font-mono text-[11px] font-semibold text-carbon/65" data-testid="artifact-hash">{shortHash(hash)}</p>
                </div>
              </div>

              <div className="space-y-3" aria-live="polite">
                {(revision?.diff ?? INITIAL_DIFF_LINES).map((line) => (
                  <div key={line.target} className="group grid gap-4 rounded-[16px] border border-carbon/[0.06] bg-white p-4 transition-colors hover:bg-shade/40 md:grid-cols-[140px_minmax(0,1fr)_28px_minmax(0,1fr)_74px] md:items-center">
                    <div>
                      <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-carbon/28">{String(line.area).replace('_', ' ')}</p>
                      <p className="mt-1 text-[12px] font-semibold leading-tight tracking-[-0.02em]">{line.target}</p>
                    </div>
                    <div className={`rounded-[12px] px-4 py-3 ${isApplied ? 'bg-carbon/[0.025] text-carbon/30 line-through' : 'bg-carbon/[0.025] text-carbon/50'}`}>
                      <p className="text-[9px] uppercase tracking-[0.1em] text-carbon/25">Before</p>
                      <p className="mt-1 text-[11px] leading-[1.4]">{valueLabel(line.before)}</p>
                    </div>
                    <ArrowRight className="hidden h-3.5 w-3.5 text-carbon/20 md:block" aria-hidden />
                    <div className={`rounded-[12px] px-4 py-3 transition-colors ${isApplied ? 'bg-moss/35' : 'bg-citronella/38'}`}>
                      <p className="text-[9px] uppercase tracking-[0.1em] text-carbon/30">{isApplied ? 'Live preview' : 'Proposed'}</p>
                      <p className="mt-1 text-[11px] font-semibold leading-[1.4] text-carbon/75">{valueLabel(line.after)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-semibold tracking-[-0.03em]">{Math.round((line.confidence ?? 0) * 100)}%</p>
                      <p className="text-[9px] text-carbon/28">confidence</p>
                    </div>
                  </div>
                ))}
              </div>

              {impact && (
                <ContextImpactGraph
                  impact={impact}
                  focusedTarget={focusedTarget}
                  onFocus={setFocusedTarget}
                />
              )}

              {approvedBrief && <ApprovedReviewBrief brief={approvedBrief} />}

              <div className="mt-7 grid gap-4 border-t border-carbon/[0.06] pt-7 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <Link2 className="h-4 w-4 shrink-0 text-carbon/35" aria-hidden />
                  <div><p className="text-[11px] font-semibold">4 linked decisions</p><p className="text-[10px] text-carbon/30">Across 4 collection areas</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <CircleDashed className="h-4 w-4 shrink-0 text-warning/55" aria-hidden />
                  <div><p className="text-[11px] font-semibold">{uncertaintyCount} {uncertaintyCount === 1 ? 'uncertainty' : 'uncertainties'}</p><p className="text-[10px] text-carbon/30">Original files not stored</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 shrink-0 text-carbon/35" aria-hidden />
                  <div><p className="text-[11px] font-semibold">Presentation requested</p><p className="text-[10px] text-carbon/30">Waits for revision approval</p></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Rail stage={stage} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-stretch">
          <Card className="rounded-[20px] border-0 bg-white py-0 shadow-none ring-0">
            <CardContent className="grid gap-6 px-7 py-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)] xl:items-center">
              <div className="min-w-0">
                <div className="flex items-start gap-4">
                  {lastReceipt ? <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success/65" aria-hidden /> : <Clock3 className="mt-1 h-5 w-5 shrink-0 text-carbon/30" aria-hidden />}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-carbon/28">Decision receipt chain</p>
                      {lastReceipt && receiptVerification?.valid && (
                        <Badge
                          variant="outline"
                          className="h-6 rounded-full border-success/15 bg-success/5 px-2.5 text-[9px] font-semibold text-success/75"
                          data-testid="receipt-verification"
                        >
                          <ShieldCheck className="h-3 w-3" aria-hidden /> Verified in signed state
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-[13px] font-semibold tracking-[-0.02em]">{lastReceipt?.summary ?? 'The audit trail will appear after human approval.'}</p>
                    <p className="mt-1 text-[10px] text-carbon/30">Every receipt binds actor, action, artifact and previous receipt hash. The server verifies the chain before signing the current session state.</p>
                  </div>
                </div>
                {state?.receipts.length ? (
                  <div className="mt-5 grid gap-2 sm:grid-cols-3" data-testid="receipt-chain" aria-label="Decision receipt chain inside signed state">
                    {state.receipts.map((receipt, index) => (
                      <div
                        key={receipt.receiptHash}
                        className={`rounded-[12px] bg-carbon/[0.03] p-4 ${index === state.receipts.length - 1 ? 'ring-1 ring-carbon/10' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-carbon px-2 text-[9px] font-semibold text-white">0{index + 1}</span>
                          <span className="font-mono text-[9px] text-carbon/30">{shortHash(receipt.receiptHash)}</span>
                        </div>
                        <p className="mt-3 text-[11px] font-semibold tracking-[-0.02em]">{RECEIPT_COPY[receipt.action]}</p>
                        <p className="mt-1 text-[9px] text-carbon/35">{receipt.actor} · {new Date(receipt.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <div className="mt-3 flex items-center gap-1.5 text-[9px] text-carbon/30">
                          <Link2 className="h-3 w-3 shrink-0" aria-hidden />
                          {receipt.previousReceiptHash ? `Linked to ${shortHash(receipt.previousReceiptHash)}` : 'Chain origin'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[12px] bg-carbon/[0.03] px-4 py-3 text-[10px] text-carbon/35">First receipt appears only after exact-hash human approval.</div>
                )}
              </div>
              <div className="flex items-center gap-3 rounded-[16px] bg-shade px-4 py-4" data-testid="webmcp-tool-activity" aria-live="polite">
                {toolActivity?.status === 'succeeded'
                  ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success/65" aria-hidden />
                  : toolActivity?.status === 'started'
                    ? <CircleDashed className="h-4 w-4 shrink-0 animate-spin text-carbon/40" aria-hidden />
                    : <Sparkles className="h-4 w-4 shrink-0 text-carbon/30" aria-hidden />}
                <div className="min-w-0">
                  <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-carbon/28">Live agent tool ledger</p>
                  <p className="mt-1 truncate text-[11px] font-semibold tracking-[-0.02em]">
                    {toolActivity ? toolActivity.toolName.replaceAll('_', ' ') : 'Waiting for native invocation'}
                  </p>
                  <p className="mt-0.5 text-[9px] text-carbon/30">
                    {toolActivity?.status === 'started'
                      ? 'Running through Site Tools'
                      : toolActivity?.status === 'succeeded'
                        ? `Completed${toolActivity.stage ? ` · ${STAGE_COPY[toolActivity.stage].label}` : ''}`
                        : toolActivity?.status === 'failed'
                          ? 'Server boundary rejected the operation'
                          : isReverted ? 'Original preview restored' : 'No browser tool has run yet'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex min-w-[330px] flex-col justify-center rounded-[20px] bg-carbon px-7 py-6 text-white">
            <Button
              className="h-11 w-full rounded-full bg-white px-7 text-[12px] font-semibold text-carbon hover:bg-white/90"
              onClick={() => void run(action.label, action.op, action.payload)}
              disabled={action.disabled || working !== null || !state}
              data-testid="primary-action"
            >
              {working === action.label ? 'Validating on server…' : action.label}
              {stage === 'preview_applied' ? <Undo2 className="h-4 w-4" aria-hidden /> : <ArrowRight className="h-4 w-4" aria-hidden />}
            </Button>
            <p className="mt-3 text-center text-[9px] leading-[1.4] text-white/35">
              {stage === 'draft_ready' ? 'You approve the exact hash shown above.' : stage === 'approved' ? 'The agent can now apply only this signed revision. This button remains as fallback.' : stage === 'preview_applied' ? 'Recovery leaves the receipt history intact.' : 'Drafting never changes collection truth.'}
            </p>
          </div>
        </section>

        {error && (
          <div role="alert" className="mt-5 rounded-[16px] border border-error/15 bg-error/5 px-5 py-4 text-[12px] text-error">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
