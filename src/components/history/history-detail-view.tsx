'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileDown, Loader2 } from 'lucide-react';
import { exportReportPdf, escapeHtml } from '@/lib/export/print-pdf';

interface HistoryDetailViewProps {
  runId: string;
  onBack: () => void;
}

function asText(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    const t = value.trim();
    if ((t.startsWith('{') || t.startsWith('[')) && t.length > 2) {
      try {
        return asText(JSON.parse(t), t);
      } catch {
        return value;
      }
    }
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => asText(item)).filter(Boolean).join('\n');
  }
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    const pick =
      o.rawGoal ??
      o.goal ??
      o.verdict ??
      o.recommendation ??
      o.finalOutput ??
      o.summary ??
      o.body ??
      o.text ??
      o.memo ??
      o.primaryObjective;
    if (pick != null && pick !== value) return asText(pick, fallback);
    const lines = Object.entries(o)
      .filter(([, v]) => v != null && typeof v !== 'object')
      .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1')}: ${v}`);
    return lines.length ? lines.join('\n') : fallback;
  }
  return fallback;
}

function scorePct(value: unknown, digits = 1) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '—';
  const ratio = n > 1.5 ? n / 100 : n;
  return `${(ratio * 100).toFixed(digits)}%`;
}

function prettyMemo(text: string) {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function money(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '$0.00';
  return `$${n.toFixed(4)}`;
}

export function HistoryDetailView({ runId, onBack }: HistoryDetailViewProps) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/history/${runId}`);
        setData(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [runId]);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center gap-3 text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-base">Loading run…</span>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center space-y-4">
        <p className="text-lg">This run could not be loaded.</p>
        <button onClick={onBack} className="btn-ghost px-4 py-2 rounded-xl text-base">
          Back
        </button>
      </div>
    );
  }

  const task = (data.task && typeof data.task === 'object' ? data.task : {}) as Record<string, unknown>;
  const spec = (data.taskSpec && typeof data.taskSpec === 'object' ? data.taskSpec : {}) as Record<string, unknown>;
  const extracted =
    spec.understanding && typeof spec.understanding === 'object'
      ? ((spec.understanding as Record<string, unknown>).extracted as Record<string, unknown> | undefined)
      : undefined;
  const result =
    data.finalResult && typeof data.finalResult === 'object' ? (data.finalResult as Record<string, unknown>) : {};
  const sessions: Record<string, unknown>[] = Array.isArray(data.sessions)
    ? (data.sessions as Record<string, unknown>[])
    : Array.isArray(data.agents)
      ? (data.agents as Record<string, unknown>[])
      : [];
  const evals: unknown[] = Array.isArray(data.evaluations) ? data.evaluations : [];
  const lastEval = evals.length ? evals[evals.length - 1] : null;
  const lastEvalObj =
    lastEval && typeof lastEval === 'object' ? (lastEval as Record<string, unknown>) : {};
  const evaluation =
    lastEvalObj.evaluation && typeof lastEvalObj.evaluation === 'object'
      ? (lastEvalObj.evaluation as Record<string, unknown>)
      : lastEvalObj;
  const dimensions =
    evaluation.dimensions && typeof evaluation.dimensions === 'object'
      ? (evaluation.dimensions as Record<string, unknown>)
      : {};

  const output = prettyMemo(
    asText(result.finalOutput) ||
      asText(result.recommendation) ||
      asText(result.verdict) ||
      'This run recorded quality and cost. Open a new analysis to write a full memo.'
  );
  const goal = asText(task.goal, asText(spec.rawGoal, 'Orchestration run'));
  const domain = asText(spec.domain, asText(extracted?.domain, 'Strategy'));
  const geography = asText(spec.geography, asText(extracted?.geography, 'Global'));
  const quality = result.overallQualityScore ?? evaluation.qualityScore;
  const reliability = result.overallReliabilityScore ?? evaluation.reliabilityScore;
  const version = result.bestVersion || 1;
  const numericDims = Object.entries(dimensions).filter(([, v]) => typeof v === 'number');

  const handlePdf = () => {
    exportReportPdf(goal, `${domain} · ${geography}`, [
      { heading: 'Verdict memo', html: `<p>${escapeHtml(output)}</p>` },
      {
        heading: 'Scores',
        html: `<p>Quality ${scorePct(quality)} · Reliability ${scorePct(reliability)} · Cost ${money(result.totalCostUSD ?? task.totalCostUSD)} · Architecture V${version}</p>`,
      },
    ]);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack} className="btn-ghost inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base">
          <ArrowLeft className="w-4 h-4" />
          Back to runs
        </button>
        <button onClick={handlePdf} className="btn-solid inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-base">
          <FileDown className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      <section className="glass-card rounded-2xl p-6 md:p-8 space-y-3">
        <p className="text-sm text-zinc-400">Goal</p>
        <h1 className="text-2xl md:text-3xl font-semibold leading-snug">{goal}</h1>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-sm px-3 py-1 rounded-full border border-white/12">{domain}</span>
          <span className="text-sm px-3 py-1 rounded-full border border-white/12">{geography}</span>
          <span className="text-sm px-3 py-1 rounded-full border border-white/12 capitalize">
            {asText(task.status, 'completed').toLowerCase()}
          </span>
        </div>
      </section>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Quality" value={scorePct(quality)} />
        <Stat label="Reliability" value={scorePct(reliability)} />
        <Stat label="Spend" value={money(result.totalCostUSD ?? task.totalCostUSD)} />
        <Stat label="Architecture" value={`V${version}`} />
      </div>

      <section className="glass-card rounded-2xl p-6 md:p-8 space-y-4">
        <h2 className="text-2xl font-semibold">Decision memo</h2>
        <p className="text-lg leading-relaxed text-zinc-200 whitespace-pre-wrap">{output}</p>
      </section>

      {numericDims.length > 0 && (
        <section className="glass-card rounded-2xl p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-semibold">Quality dimensions</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {numericDims.map(([dim, score]) => {
              const n = score as number;
              const ratio = n > 1.5 ? n / 100 : n;
              return (
                <div key={dim} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex justify-between text-base mb-2">
                    <span className="capitalize text-zinc-300">{dim.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="tabular-nums">{scorePct(ratio, 0)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-white/80" style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {sessions.length > 0 && (
        <section className="glass-card rounded-2xl p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-semibold">Specialists</h2>
          <div className="space-y-2">
            {sessions.map((sess, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 rounded-xl border border-white/8 px-4 py-3"
              >
                <div>
                  <p className="text-base font-medium">
                    {asText(sess.agentName ?? sess.name, 'Specialist')}
                  </p>
                  <p className="text-sm text-zinc-500">{asText(sess.model ?? sess.role, 'model')}</p>
                </div>
                <p className="text-base text-zinc-400">
                  {money(sess.cost)} · {asText(sess.latencyMs, '—')}
                  {typeof sess.latencyMs === 'number' ? 'ms' : ''}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-sm text-zinc-400 mb-1">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
