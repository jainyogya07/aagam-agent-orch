'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { CountUp } from '@/components/bits/count-up';
import { WhatWhy } from '@/components/bits/what-why';
import { VersionLoader } from '@/components/bits/version-loader';
import { InlineWorkflow } from '@/components/analysis/inline-workflow';
import type { QualityGateResult } from '@/lib/types/claims';
import type { AgentContribution } from '@/lib/analysis/demo-run';
import type { Architecture } from '@/lib/types/architecture';

type ReportPhase = 'understanding' | 'architecting' | 'executing' | 'quality-gate' | 'completed';

export function EvolutionStage({
  v1,
  v2,
  v1Agents,
  v2Agents,
  v1Architecture,
  v2Architecture,
  phase,
  removed,
  reclaimed,
  tab,
  onTabChange,
}: {
  v1: QualityGateResult | null;
  v2: QualityGateResult | null;
  v1Agents: AgentContribution[];
  v2Agents: AgentContribution[];
  v1Architecture?: Architecture | null;
  v2Architecture?: Architecture | null;
  phase: ReportPhase;
  removed: string;
  reclaimed: number;
  tab?: 'v1' | 'v2';
  onTabChange?: (tab: 'v1' | 'v2') => void;
}) {
  const [inner, setInner] = useState<'v1' | 'v2'>(v2 ? 'v2' : 'v1');
  const active = tab ?? inner;
  const setActive = (next: 'v1' | 'v2') => {
    setInner(next);
    onTabChange?.(next);
  };
  useEffect(() => {
    if (v2) setActive('v2');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v2]);

  const v1Loading = !v1 && (phase === 'understanding' || phase === 'architecting' || phase === 'executing');
  const v2Loading = Boolean(v1) && !v2 && phase === 'quality-gate';

  if (!v1 && v1Loading) {
    return (
      <section className="space-y-3">
        <VersionLoader label="V1" note="First team is being designed and reserved." />
      </section>
    );
  }
  if (!v1) return null;

  const keptV1 = !v2;
  const showing = active === 'v2' && v2Architecture ? v2Architecture : v1Architecture;
  const showingAgents = active === 'v2' && v2 ? v2Agents : v1Agents;
  const showingQuality = active === 'v2' && v2 ? v2 : v1;

  if (v2Loading) {
    return (
      <section className="space-y-3">
        <VersionLoader label="V2" note="Measuring contribution. Mutating only if it pays." />
      </section>
    );
  }

  return (
    <section className="glass-card rounded-xl p-4 md:p-5 space-y-4 anim-fade-up">
      <div>
        <p className="text-sm uppercase tracking-wide text-zinc-500">V1 and V2 — you can inspect both</p>
        <h3 className="text-base font-semibold">
          {keptV1 ? 'V1 ran. Expected value of change was not positive — we kept V1.' : 'V1 ran. Low-value work was dropped. V2 ran again.'}
        </h3>
      </div>
      <WhatWhy
        what="V1 is the first team. V2 is a measured change — drop, add, rewire, or keep."
        why="We never hardcode V2. If change would not pay, the honest move is KEEP V1."
      />

      <div className="grid md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
        <button type="button" onClick={() => setActive('v1')} className="text-left">
          <VersionCard
            label="V1"
            score={v1.overallScore}
            agents={v1Agents.length}
            note="First team"
            highlight={active === 'v1'}
          />
        </button>
        <div className="flex flex-col items-center text-center text-sm text-zinc-400 gap-1">
          <ArrowRight className="w-4 h-4 anim-nudge" />
          <span>{keptV1 ? 'keep V1' : `drop ${removed}`}</span>
          <span className="font-mono">{keptV1 ? 'EV ≤ 0' : `$${reclaimed.toFixed(3)} back`}</span>
        </div>
        <button type="button" onClick={() => v2 && setActive('v2')} className="text-left" disabled={!v2}>
          <VersionCard
            label="V2"
            score={v2?.overallScore ?? null}
            agents={v2 ? v2Agents.length : v1Agents.length}
            note={v2 ? 'Low-value work dropped' : 'Not created — keeping V1'}
            highlight={active === 'v2'}
          />
        </button>
      </div>

      {v2 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Delta label="Quality" from={v1.overallScore} to={v2.overallScore} pct />
          <Delta label="Evidence" from={v1.dimensions.evidence} to={v2.dimensions.evidence} pct />
          <Delta label="Reliability" from={v1.dimensions.consistency} to={v2.dimensions.consistency} pct />
          <Delta label="Agents" from={v1Agents.length} to={v2Agents.length} />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActive('v1')}
          className={`px-3 py-1.5 rounded-lg text-sm border ${active === 'v1' ? 'bg-white text-black border-white' : 'border-white/15'}`}
        >
          V1 analysis
        </button>
        <button
          type="button"
          onClick={() => v2 && setActive('v2')}
          disabled={!v2}
          className={`px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40 ${active === 'v2' ? 'bg-white text-black border-white' : 'border-white/15'}`}
        >
          V2 analysis
        </button>
      </div>

      {showingQuality && (
        <div className="rounded-xl border border-white/10 p-3 space-y-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <span>Quality {(showingQuality.overallScore * 100).toFixed(1)}%</span>
            <span>Confidence {(showingQuality.evidenceCoverageRatio * 100).toFixed(1)}%</span>
            <span>Reliability {(showingQuality.dimensions.consistency * 100).toFixed(1)}%</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(showingQuality.dimensions).map(([name, score]) => (
              <div key={name} className="rounded-lg border border-white/8 px-2.5 py-2">
                <p className="text-xs text-zinc-500 capitalize">{name.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-sm font-medium tabular-nums">{Math.round(score * 100)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showing && (
        <InlineWorkflow
          architecture={showing}
          contributions={showingAgents}
          phase={phase === 'understanding' ? 'architecting' : phase}
        />
      )}
    </section>
  );
}

function VersionCard({
  label,
  score,
  agents,
  note,
  highlight,
}: {
  label: string;
  score: number | null;
  agents: number;
  note: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-white/25 bg-white/10 anim-glow-soft' : 'border-white/10 bg-white/[0.03]'}`}>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">
        {score == null ? '—' : <CountUp value={score * 100} suffix="%" digits={1} />}
      </p>
      <p className="text-sm text-zinc-500 mt-1">{agents} agents · {note}</p>
    </div>
  );
}

function Delta({ label, from, to, pct }: { label: string; from: number; to: number; pct?: boolean }) {
  const delta = to - from;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-white/10 px-3 py-2">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="text-sm font-medium tabular-nums">
        {delta >= 0 ? '+' : ''}
        {pct ? `${(delta * 100).toFixed(1)} pts` : delta}
      </p>
    </motion.div>
  );
}
