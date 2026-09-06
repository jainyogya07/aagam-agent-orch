'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DecryptedText } from '@/components/bits/decrypted-text';

export interface AOLiveState {
  ok: boolean;
  fake: false;
  sessionId?: string;
  harness?: string;
  worktreeBranch?: string;
  worktreePath?: string;
  status?: string;
  error?: string;
  daemon?: { status: string };
}

export function AOLivePanel({ state, polling }: { state: AOLiveState | null; polling: boolean }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!polling) return;
    const id = setInterval(() => setTick((n) => n + 1), 1200);
    return () => clearInterval(id);
  }, [polling]);

  return (
    <section className="glass-card rounded-xl p-4 md:p-5 space-y-3 anim-fade-up">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm uppercase tracking-wide text-zinc-400">AO coding</p>
          <h3 className="text-base font-semibold">Real isolated session — never faked</h3>
        </div>
        <span className={`text-sm px-2 py-0.5 rounded-full border ${polling ? 'anim-pulse-ring border-white/30' : 'border-white/12'}`}>
          {polling ? 'checking AO' : state?.ok ? 'live' : 'idle'}
        </span>
      </div>

      {!state && (
        <p className="text-sm text-zinc-400">Coding starts only if it is worth the $0.02 reservation. Sessions show here and in the AO sidebar — the Board is for pull requests, not sessions.</p>
      )}

      {state && !state.ok && (
        <div className="rounded-lg border border-white/15 bg-white/[0.03] p-3 text-sm leading-relaxed">
          <DecryptedText text={state.error || 'AO daemon unreachable'} className="font-mono" />
          <p className="text-zinc-500 mt-2">AAGAM will not draw a fake Board card. Start the AO desktop app, then re-run.</p>
        </div>
      )}

      {state?.ok && (
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <LiveRow label="Session" value={state.sessionId || '—'} pulse={polling} />
          <LiveRow label="Harness" value={state.harness || '—'} />
          <LiveRow label="Status" value={`${state.status || 'unknown'}${tick ? '' : ''}`} pulse={polling} />
          <LiveRow label="Worktree" value={state.worktreeBranch || '—'} />
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-zinc-500 overflow-x-auto">
        {['hold $0.02', 'AO spawn', 'isolated folder', 'coding harness', 'code artifact', 'AAGAM verify'].map((step, i) => (
          <motion.span
            key={step}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: state?.ok || polling ? 1 : 0.4 }}
            transition={{ delay: i * 0.08 }}
            className="whitespace-nowrap px-2 py-1 rounded-full border border-white/10"
          >
            {step}
          </motion.span>
        ))}
      </div>
    </section>
  );
}

function LiveRow({ label, value, pulse }: { label: string; value: string; pulse?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`font-mono text-sm truncate ${pulse ? 'anim-flicker' : ''}`}>{value}</p>
    </div>
  );
}
