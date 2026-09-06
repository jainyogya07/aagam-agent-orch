'use client';

import { ExternalLink } from 'lucide-react';
import { WhatWhy } from '@/components/bits/what-why';
import { GlareHover } from '@/components/bits/glare-hover';
import type { AoSessionLite } from '@/components/ao/ao-presence';

export type TraceRun = {
  runId: string;
  goal: string;
  quality?: number;
  reliability?: number;
  aoSessionId?: string;
};

function layer(role?: string) {
  if (role === 'orchestrator') return 'Architecture session';
  if (role === 'worker') return 'Agent session';
  return 'AO session';
}

const FALLBACK_TRACES: TraceRun[] = [
  { runId: '7cc80261-8834-445a-9057-7a4929b9e40a', goal: 'Fortune 500 L1 support ROI' },
  { runId: 'ae385efa-0853-40ce-8b94-3e3cf71a5e5e', goal: 'Multi-agent resource exchange viability' },
  { runId: 'run_ayurveda_003', goal: 'Ayurvedic MedTech in India' },
  { runId: 'run_ev_dach_004', goal: 'DACH ultra-fast charging thesis' },
  { runId: 'run_beauty_apac_005', goal: 'APAC clean beauty D2C' },
  { runId: 'run_climate_sea_006', goal: 'SEA climate-tech underwriting' },
  { runId: 'run_fintech_india_007', goal: 'India UPI SME credit rails' },
];

export function SessionLayers({
  aoOk,
  aoSessions,
  traces,
  currentRunId,
  focus = 'both',
}: {
  aoOk: boolean;
  aoSessions: AoSessionLite[];
  traces: TraceRun[];
  currentRunId?: string | null;
  focus?: 'ao' | 'neatlogs' | 'both';
}) {
  const live = aoSessions.filter((s) => !s.isTerminated);
  const ended = aoSessions.filter((s) => s.isTerminated);
  const neatlogs = [
    ...(currentRunId ? [{ runId: currentRunId, goal: 'This analysis' }] : []),
    ...traces,
    ...FALLBACK_TRACES,
  ].filter((t, i, arr) => arr.findIndex((x) => x.runId === t.runId) === i);

  const arch = live.filter((s) => s.role === 'orchestrator');
  const workers = live.filter((s) => s.role !== 'orchestrator');
  const workerList = workers.length ? workers : live;

  return (
    <section className="rounded-2xl border border-white/15 bg-zinc-950 p-5 space-y-4">
      <div>
        <p className="text-sm text-zinc-400">{focus === 'neatlogs' ? 'Neatlogs · full list' : focus === 'ao' ? 'AO realtime · full list' : 'AO + Neatlogs'}</p>
        <h3 className="text-lg font-semibold text-zinc-50">
          {focus === 'neatlogs' ? 'Traces you can open' : focus === 'ao' ? 'Live sessions on this machine' : 'Sessions you can actually open'}
        </h3>
      </div>
      <WhatWhy
        what="Task session = your goal. Architecture session = V1 or V2. Agent session = one specialist in an isolated folder. Neatlogs = the trace of model and tool calls."
        why="V2 must not copy the whole V1 chat. Only verified artifacts move forward. Traces prove work happened; they do not pick the team."
      />

      {focus !== 'neatlogs' && (
      <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 p-3 space-y-2">
          <p className="text-sm text-zinc-400">Task session</p>
          <p className="text-sm text-zinc-200">{currentRunId ? currentRunId : 'Appears when you Analyze.'}</p>
          <p className="text-sm text-zinc-500">Your problem. One intent. Not a workflow you drew.</p>
        </div>
        <div className="rounded-xl border border-white/10 p-3 space-y-2">
          <p className="text-sm text-zinc-400">Architecture sessions</p>
          {arch.length ? arch.map((s) => (
            <p key={s.id} className="text-sm text-zinc-200">{s.displayName || s.id} · {s.status}</p>
          )) : <p className="text-sm text-zinc-500">{live[0] ? 'Workers are live; orchestrator may be idle in AO sidebar.' : 'Waiting on AO daemon.'}</p>}
        </div>
        <div className="rounded-xl border border-white/10 p-3 space-y-2">
          <p className="text-sm text-zinc-400">Agent sessions (AO)</p>
          <p className="text-sm text-zinc-200">{aoOk ? `${live.length} live` : 'AO offline'}</p>
          <p className="text-sm text-zinc-500">Board = PRs. This list = sessions.</p>
        </div>
      </div>
      )}

      {focus !== 'neatlogs' && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-400">AO live workers</p>
          {workerList.length === 0 ? (
            <p className="text-sm text-zinc-500">Start AO desktop. We will not draw a fake Board card.</p>
          ) : (
            <ul className="grid sm:grid-cols-2 gap-2">
              {workerList.map((s) => (
                <li key={s.id}>
                  <GlareHover className="rounded-lg">
                    <div className="rounded-lg border border-white/10 px-3 py-2 bg-zinc-900/50">
                      <p className="text-sm font-medium text-zinc-100 flex items-center gap-2">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-100 anim-pulse-soft" />
                        {s.displayName || s.name || s.id}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {layer(s.role)} · {s.id} · {s.activity?.state || s.status || 'active'} · {s.harness || 'ao'}
                      </p>
                    </div>
                  </GlareHover>
                </li>
              ))}
            </ul>
          )}
          {ended.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-zinc-400">Ended sessions</p>
              <ul className="grid sm:grid-cols-2 gap-2">
                {ended.map((s) => (
                  <li key={s.id} className="rounded-lg border border-white/8 px-3 py-2">
                    <p className="text-sm font-medium text-zinc-300">{s.displayName || s.name || s.id}</p>
                    <p className="text-sm text-zinc-600">terminated · {s.id}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {focus !== 'ao' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">Neatlogs traces</p>
            <a href="https://app.neatlogs.com" target="_blank" rel="noreferrer" className="text-sm inline-flex items-center gap-1 text-zinc-300 hover:text-white">
              Dashboard <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <ul className="grid sm:grid-cols-2 gap-2">
            {neatlogs.map((t) => (
              <li key={t.runId}>
                <a
                  href={`https://app.neatlogs.com/sessions/${t.runId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-white/10 px-3 py-2 flex items-center justify-between gap-3 hover:bg-zinc-900"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">{t.goal}</p>
                    <p className="text-sm text-zinc-500 font-mono">{t.runId.slice(0, 22)}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
