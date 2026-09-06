'use client';

import {
  ArrowLeft,
  FileDown,
  Check,
  Loader2,
} from 'lucide-react';
import type { UnderstandingPhase, TaskSpec } from '@/lib/architect/goal-parser';
import type { Architecture } from '@/lib/types/architecture';
import type { QualityGateResult } from '@/lib/types/claims';
import type { AnalysisSynthesis, AgentContribution } from '@/lib/analysis/demo-run';
import { exportAnalysisPdf } from '@/lib/export/analysis-pdf';
import { EvolutionStage } from '@/components/evolution/evolution-stage';
import { GlareHover } from '@/components/bits/glare-hover';
import { WhatWhy } from '@/components/bits/what-why';
import { ScrollHint } from '@/components/bits/scroll-hint';
import { useState } from 'react';

export type AnalysisPhase =
  | 'understanding'
  | 'architecting'
  | 'executing'
  | 'quality-gate'
  | 'completed';

interface AnalysisReportProps {
  goal: string;
  phase: AnalysisPhase;
  taskSpec: TaskSpec | null;
  understanding: UnderstandingPhase | null;
  architecture: Architecture | null;
  architectureV1?: Architecture | null;
  architectureV2?: Architecture | null;
  contributions: AgentContribution[];
  qualityResult: QualityGateResult | null;
  v1Quality?: QualityGateResult | null;
  v2Quality?: QualityGateResult | null;
  v1Contributions?: AgentContribution[];
  synthesis: AnalysisSynthesis | null;
  onBack: () => void;
  onNewAnalysis: () => void;
}

const STEPS: { id: AnalysisPhase; label: string }[] = [
  { id: 'understanding', label: 'Understand' },
  { id: 'architecting', label: 'Architect' },
  { id: 'executing', label: 'Execute' },
  { id: 'quality-gate', label: 'Quality' },
  { id: 'completed', label: 'Decision' },
];

function stepIndex(phase: AnalysisPhase) {
  return STEPS.findIndex((s) => s.id === phase);
}

export function AnalysisReport({
  goal,
  phase,
  taskSpec,
  understanding,
  architecture,
  architectureV1 = null,
  architectureV2 = null,
  contributions,
  qualityResult,
  v1Quality = null,
  v2Quality = null,
  v1Contributions = [],
  synthesis,
  onBack,
  onNewAnalysis,
}: AnalysisReportProps) {
  const current = stepIndex(phase);
  const [pickedAgent, setPickedAgent] = useState<string | null>(null);
  const scraper = (v1Contributions.length ? v1Contributions : contributions).find((c) => c.agentId === 'raw-scraper');
  const picked = architecture?.nodes.find((n) => n.id === pickedAgent);

  const handlePdf = () => {
    exportAnalysisPdf({ goal, understanding, synthesis, qualityResult });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="btn-ghost inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <button
            onClick={onNewAnalysis}
            className="btn-ghost px-3 py-1.5 rounded-lg text-sm"
          >
            New analysis
          </button>
        </div>
        <button
          onClick={handlePdf}
          className="btn-solid inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
        >
          <FileDown className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      <div className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">What to do next</p>
          <p className="text-base">Scroll the loop. Open V1 or V2 to inspect that analysis.</p>
        </div>
        <ScrollHint
          label="Scroll"
          onClick={() => document.getElementById('aagam-loop')?.scrollIntoView({ behavior: 'smooth' })}
        />
      </div>

      <div className="flex flex-wrap gap-2" id="aagam-loop">
        {STEPS.map((step, i) => {
          const active = i === current;
          const done = i < current;
          return (
            <div
              key={step.id}
              className={`px-3 py-1 rounded-full text-sm border ${
                active || done
                  ? 'border-white/20 bg-white/10 text-white anim-pulse-soft'
                  : 'border-white/8 bg-white/[0.03] text-zinc-500'
              }`}
            >
              {done ? '✓ ' : active ? '● ' : ''}
              {step.label}
            </div>
          );
        })}
      </div>

      <section className="glass-card rounded-xl p-4 md:p-5 anim-fade-up">
        <p className="text-sm text-zinc-400 mb-1">Your problem</p>
        <p className="text-sm md:text-base font-medium leading-snug">{goal}</p>
        {taskSpec && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            <MetaChip label={taskSpec.domain} />
            <MetaChip label={taskSpec.geography} />
            <MetaChip label={taskSpec.understanding.extracted.primaryObjective} />
          </div>
        )}
      </section>

      <EvolutionStage
        v1={v1Quality}
        v2={v2Quality}
        v1Agents={v1Contributions.length ? v1Contributions : contributions}
        v2Agents={v2Quality ? contributions : []}
        v1Architecture={architectureV1}
        v2Architecture={architectureV2}
        phase={phase}
        removed={scraper?.name ?? 'low-value specialist'}
        reclaimed={scraper?.cost ?? 0}
      />

      {understanding && (
        <section className="glass-card rounded-2xl p-6 md:p-8 space-y-5">
          <Header
            title="Understanding"
            subtitle="What we extracted from ordinary English — you did not pick agents"
            done={phase !== 'understanding'}
          />
          <WhatWhy
            what="A structured reading of your sentence: goal, domain, geography, required outputs."
            why="The orchestrator cannot allocate a team from vibes. This is the spec the rest of the loop is funded against."
          />
          <div className="grid md:grid-cols-2 gap-4">
            <InfoBlock label="Objective" value={understanding.extracted.primaryObjective} />
            <InfoBlock label="Domain" value={understanding.extracted.domain} />
            <InfoBlock label="Geography" value={understanding.extracted.geography} />
            <InfoBlock label="Target users" value={understanding.extracted.targetUsers} />
          </div>
          <div>
            <p className="text-sm text-zinc-400 mb-2">Required analysis</p>
            <ul className="grid md:grid-cols-2 gap-1.5">
              {understanding.extracted.requiredAnalysis.map((item) => (
                <li key={item} className="text-sm text-zinc-200 flex gap-2">
                  <span className="text-zinc-500">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {architecture && (
        <section className="glass-card rounded-2xl p-6 md:p-8 space-y-5">
          <Header
            title="Who earned their budget"
            subtitle="Marginal contribution — agents stay only if they add value"
            done={contributions.length > 0}
          />
          <WhatWhy
            what="Each specialist is scored on extra value added to the final decision — not on how busy they looked."
            why="A normal system keeps running all three. We reclaim the one that did not pay, and may fund V2."
          />
          <div className="grid md:grid-cols-2 gap-3">
            {architecture.nodes.map((node) => {
              const c = contributions.find((x) => x.agentId === node.id);
              return (
                <GlareHover key={node.id}>
                  <button
                    onClick={() => setPickedAgent(node.id)}
                    className={`w-full text-left rounded-xl border p-3 transition-all ${
                      pickedAgent === node.id
                        ? 'border-white/40 bg-white/10 anim-select-pop'
                        : 'border-white/10 bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold">{node.name}</h3>
                      {c ? (
                        <span className="text-sm tabular-nums">{(c.contribution * 100).toFixed(0)}%</span>
                      ) : (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      )}
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{c?.summary ?? 'Working…'}</p>
                  </button>
                </GlareHover>
              );
            })}
          </div>
          {picked && (
            <WhatWhy
              what={`${picked.name} is a ${picked.role}. Budget reserved: $${picked.resourceBudget.maxCost.toFixed(2)}.`}
              why={picked.objective}
            />
          )}
        </section>
      )}

      {synthesis && (
        <section className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
          <Header title="Decision" subtitle="The gap, not a list of companies" done />
          <WhatWhy
            what={synthesis.verdict}
            why={synthesis.verdictDetail}
          />
          <div>
            <p className="text-sm text-zinc-400 mb-2">Market gap</p>
            <p className="text-sm leading-relaxed">{synthesis.marketGap}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {synthesis.findings.map((f) => (
              <div key={f.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-2">
                <h4 className="text-sm font-semibold">{f.title}</h4>
                <p className="text-sm text-zinc-300 leading-relaxed">{f.body}</p>
                <p className="text-sm text-zinc-500">{f.source}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-white/10 p-5 space-y-3">
            <p className="text-sm text-zinc-400">Recommendation</p>
            <p className="text-sm leading-relaxed">{synthesis.recommendation}</p>
            <ul className="space-y-1.5 pt-2">
              {synthesis.nextSteps.map((s) => (
                <li key={s} className="text-sm text-zinc-300 flex gap-2">
                  <span className="text-zinc-500">→</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm text-zinc-400 mb-3">Evidence lineage</p>
            <div className="space-y-2">
              {synthesis.evidenceLineage.map((e) => (
                <div key={e.claim} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 rounded-lg border border-white/8 px-4 py-3">
                  <span className="text-sm">{e.claim}</span>
                  <span className="text-sm text-zinc-500">{e.source}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {phase !== 'completed' && !synthesis && (
        <div className="flex items-center gap-3 text-sm text-zinc-400 px-1">
          <Loader2 className="w-4 h-4 animate-spin" />
          {phase === 'understanding' && 'Reading the goal…'}
          {phase === 'architecting' && 'Choosing who should work and what they may spend…'}
          {phase === 'executing' && 'Running the team under reserved budgets…'}
          {phase === 'quality-gate' && 'Scoring the outcome…'}
        </div>
      )}
    </div>
  );
}

function Header({ title, subtitle, done }: { title: string; subtitle: string; done: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 w-8 h-8 rounded-full border border-white/15 bg-white/5 flex items-center justify-center">
        {done ? <Check className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
      </div>
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-zinc-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-sm text-zinc-400 mb-1">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function MetaChip({ label }: { label: string }) {
  return (
    <span className="text-sm px-2.5 py-0.5 rounded-full border border-white/12 bg-white/5 text-zinc-200">
      {label}
    </span>
  );
}
