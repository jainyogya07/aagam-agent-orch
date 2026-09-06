'use client';

import { ExternalLink, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AoSessionLite } from '@/components/ao/ao-presence';
import type { TraceRun } from '@/components/sessions/session-layers';
import { GlareHover } from '@/components/bits/glare-hover';

const FALLBACK_TRACES: TraceRun[] = [
  { runId: '7cc80261-8834-445a-9057-7a4929b9e40a', goal: 'Fortune 500 L1 support' },
  { runId: 'ae385efa-0853-40ce-8b94-3e3cf71a5e5e', goal: 'Resource exchange viability' },
  { runId: 'run_ayurveda_003', goal: 'Ayurvedic MedTech India' },
  { runId: 'run_ev_dach_004', goal: 'DACH ultra-fast charging' },
  { runId: 'run_beauty_apac_005', goal: 'APAC clean beauty D2C' },
  { runId: 'run_climate_sea_006', goal: 'SEA climate-tech underwriting' },
  { runId: 'run_fintech_india_007', goal: 'India UPI SME credit' },
  { runId: 'run_logistics_gcc_008', goal: 'GCC last-mile robotics' },
];

export function AoLiveStrip({
  aoOk,
  aoSessions,
}: {
  aoOk: boolean;
  aoSessions: AoSessionLite[];
}) {
  const live = aoSessions.filter((s) => !s.isTerminated);
  const ended = aoSessions.filter((s) => s.isTerminated);

  return (
    <section className="rounded-2xl border border-white/15 bg-zinc-950/80 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Radio className={`w-4 h-4 ${aoOk ? 'text-zinc-100 anim-pulse-soft' : 'text-zinc-600'}`} />
          <div>
            <p className="text-sm text-zinc-400">AO realtime · beside submit</p>
            <p className="text-base text-zinc-100">
              {aoOk
                ? `${live.length} live · ${ended.length} ended`
                : 'Daemon offline — no invented sessions'}
            </p>
          </div>
        </div>
        <span className={`text-sm px-2.5 py-0.5 rounded-full border ${aoOk ? 'border-white/25 anim-pulse-ring' : 'border-white/10 text-zinc-500'}`}>
          {aoOk ? 'live' : 'offline'}
        </span>
      </div>
      {live.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {live.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <GlareHover className="rounded-xl">
                <div className="rounded-xl border border-white/12 bg-zinc-900/70 px-3 py-2.5">
                  <p className="text-sm font-medium text-zinc-50 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-100 anim-pulse-soft" />
                    {s.displayName || s.name || s.id}
                  </p>
                  <p className="text-sm text-zinc-500 mt-0.5 truncate">
                    {s.role === 'orchestrator' ? 'Architecture' : 'Agent'} · {s.id} · {s.activity?.state || s.status || 'active'}
                  </p>
                </div>
              </GlareHover>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Start AO desktop, then Analyze. Full list is lower on this page.</p>
      )}
    </section>
  );
}

export function NeatlogsStrip({
  traces,
  currentRunId,
}: {
  traces: TraceRun[];
  currentRunId?: string | null;
}) {
  const list = [
    ...(currentRunId ? [{ runId: currentRunId, goal: 'This analysis' }] : []),
    ...traces,
    ...FALLBACK_TRACES,
  ].filter((t, i, arr) => arr.findIndex((x) => x.runId === t.runId) === i);

  return (
    <section className="rounded-2xl border border-white/15 bg-zinc-950/80 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-400">Neatlogs · beside submit</p>
          <p className="text-base text-zinc-100">{list.length} traces you can open</p>
        </div>
        <a
          href="https://app.neatlogs.com"
          target="_blank"
          rel="noreferrer"
          className="text-sm inline-flex items-center gap-1 text-zinc-300 hover:text-white"
        >
          Dashboard <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {list.map((t, i) => (
          <motion.a
            key={t.runId}
            href={`https://app.neatlogs.com/sessions/${t.runId}`}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-xl border border-white/12 bg-zinc-900/70 px-3 py-2.5 hover:border-white/30"
          >
            <p className="text-sm font-medium text-zinc-100 truncate">{t.goal}</p>
            <p className="text-sm text-zinc-500 font-mono mt-0.5">{t.runId.slice(0, 18)}</p>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
