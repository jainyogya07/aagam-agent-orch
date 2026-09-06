'use client';

import { WhatWhy } from '@/components/bits/what-why';
import { GlareHover } from '@/components/bits/glare-hover';
import { motion } from 'framer-motion';

const LOOP = [
  { n: '1', label: 'Understand', what: 'Turn English into a structured goal.' },
  { n: '2', label: 'Architect', what: 'Pick who should work.' },
  { n: '3', label: 'Allocate', what: 'Hold money so it is not spent twice.' },
  { n: '4', label: 'Execute', what: 'OpenAI research + one real AO coding session.' },
  { n: '5', label: 'Evaluate', what: 'Score quality, evidence, confidence.' },
  { n: '6', label: 'Evolve', what: 'V2 only if it is worth it.' },
];

const STORY = [
  {
    k: 'The gap',
    what: 'Agents, traces, marketplaces, and orchestrators already exist. OpenAI runs agents. Neatlogs watches. AO isolates coding. TensorMux swaps models.',
    why: 'The missing question is: if you give a brand-new problem, who should work, how much may they spend, was it valuable, and should the team change?',
  },
  {
    k: 'What we built',
    what: 'You write a problem in ordinary English. You do not pick agents, tools, or a budget. The system writes the workflow from the goal.',
    why: 'Founders should not have to design a DAG. “Give us a problem, not a workflow.”',
  },
  {
    k: 'The orchestrator',
    what: 'The decision brain: what to do, who, which capability to buy, how much resource, what to verify, whether to change the architecture.',
    why: 'OpenAI executes a turn. AO runs a worktree. Neither should decide the organization of the team.',
  },
  {
    k: 'X-factor',
    what: 'A closed loop: Understand → Plan → Allocate → Execute → Verify → Measure → Mutate → Execute again. Architecture itself can be funded, scored, and changed.',
    why: 'Building another agent is not the product. Asking “was this architecture worth the money?” is.',
  },
  {
    k: 'Money is not free',
    what: 'REQUESTED → RESERVED → APPROVED → CONSUMED → RECLAIMED. Unused budget comes back. Parallel agents cannot double-spend.',
    why: 'If someone was given $0.10 and used $0.06, $0.04 should return. Low-value agents should not keep a seat.',
  },
  {
    k: 'V1 → V2',
    what: 'V1 actually runs. Then we measure. V2 can drop an agent, add one, rewire, swap a model, or keep V1.',
    why: 'V2 is never hardcoded. If expected value is not positive, we keep V1.',
  },
];

export function LandingStory() {
  return (
    <div className="space-y-8 pb-16">
      <div>
        <p className="text-sm text-zinc-500 mb-3">The simple process</p>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {LOOP.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <p className="text-sm text-zinc-500">{s.n}</p>
              <p className="text-base font-medium">{s.label}</p>
              <p className="text-sm text-zinc-400 mt-1 leading-snug">{s.what}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {STORY.map((s, i) => (
          <motion.div
            key={s.k}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.04 }}
          >
            <GlareHover>
              <div className="glass-card rounded-2xl p-5 space-y-3 h-full">
                <h3 className="text-lg font-semibold">{s.k}</h3>
                <WhatWhy stacked what={s.what} why={s.why} />
              </div>
            </GlareHover>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
