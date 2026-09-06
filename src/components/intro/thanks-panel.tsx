'use client';

import { motion } from 'framer-motion';
import { Magnet } from '@/components/bits/magnet';
import { GlareHover } from '@/components/bits/glare-hover';
import { SplitReveal } from '@/components/bits/split-reveal';

const FLOATS = [
  { label: 'AI Grant', x: '8%', delay: 0 },
  { label: 'TensorMux', x: '32%', delay: 0.12 },
  { label: 'Neatlogs', x: '54%', delay: 0.2 },
  { label: 'Agent Orchestrator', x: '74%', delay: 0.08 },
];

const PEOPLE = [
  { name: 'Lakshay Jain', role: 'Builder' },
  { name: 'Yogay Jain', role: 'Builder' },
];

const CONTRIBUTORS = [
  { name: 'AI Grant', also: 'aigrant', what: 'The grant that let this loop exist as a product.' },
  { name: 'TensorMux', also: 'tensormux', what: 'Routes the right model when the work is cheap or hard.' },
  { name: 'Neatlogs', also: 'neatlogs', what: 'Observes agent → model → tool. We do not fake thinking.' },
  { name: 'Agent Orchestrator', also: 'AO', what: 'Isolated coding sessions and worktrees. Board is for PRs.' },
];

export function ThanksPanel() {
  return (
    <div className="space-y-8">
      <div className="relative h-32 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60">
        {FLOATS.map((f) => (
          <motion.div
            key={f.label}
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: f.x }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: [0, -10, 0] }}
            transition={{
              opacity: { delay: f.delay, duration: 0.4 },
              y: { delay: f.delay, duration: 4.6 + f.delay, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <Magnet strength={16}>
              <span className="inline-block rounded-full border border-white/20 bg-zinc-900 px-3.5 py-1.5 text-sm text-zinc-100 whitespace-nowrap">
                {f.label}
              </span>
            </Magnet>
          </motion.div>
        ))}
      </div>

      <div className="text-center space-y-3">
        <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Thank you</p>
        <h2 className="text-4xl md:text-5xl font-semibold">
          <SplitReveal text="AAGAM" />
        </h2>
        <p className="text-base text-zinc-400 max-w-lg mx-auto leading-relaxed">
          Built by the two of us. The loop is real because these contributors showed up.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto">
        {PEOPLE.map((p) => (
          <div key={p.name} className="rounded-2xl border border-white/15 bg-zinc-900/80 p-5 text-center">
            <p className="text-xl font-semibold text-zinc-50">{p.name}</p>
            <p className="text-sm text-zinc-500 mt-1">{p.role}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {CONTRIBUTORS.map((c) => (
          <GlareHover key={c.name} className="rounded-2xl">
            <div className="rounded-2xl border border-white/12 bg-zinc-950 p-4 space-y-1">
              <p className="text-base font-semibold">{c.name}</p>
              <p className="text-sm text-zinc-500">{c.also}</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{c.what}</p>
            </div>
          </GlareHover>
        ))}
      </div>
    </div>
  );
}
