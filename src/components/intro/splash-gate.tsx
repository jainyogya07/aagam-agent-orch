'use client';

import { motion } from 'framer-motion';
import { AmbientStage } from '@/components/bits/ambient-stage';
import { ClickSpark } from '@/components/bits/click-spark';
import { Magnet } from '@/components/bits/magnet';
import { StarBorder } from '@/components/bits/star-border';
import { SplitReveal } from '@/components/bits/split-reveal';
import { ArrowRight } from 'lucide-react';

const PILLARS = [
  {
    k: 'What this is',
    body: 'An orchestrator. You describe a new problem in English. AAGAM decides who should work, what they may spend, whether the work was valuable, and whether the team should change.',
  },
  {
    k: 'What you do',
    body: 'Write the problem. Do not pick agents, tools, models, or a budget. That design is the product.',
  },
  {
    k: 'What this is not',
    body: 'Not a chatbot that draws a pretty graph. Not a fake Board. OpenAI executes research. AO codes in an isolated folder. Neatlogs observes. TensorMux routes models.',
  },
];

const LOOP = [
  { n: '01', label: 'Understand', line: 'Turn English into a funded goal.' },
  { n: '02', label: 'Architect', line: 'Choose who should work.' },
  { n: '03', label: 'Allocate', line: 'Hold money so it is not spent twice.' },
  { n: '04', label: 'Execute', line: 'Research plus one real coding session.' },
  { n: '05', label: 'Evaluate', line: 'Score quality, evidence, confidence.' },
  { n: '06', label: 'Evolve', line: 'V2 only if expected value is positive.' },
];

export function SplashGate({ onEnter }: { onEnter: () => void }) {
  return (
    <ClickSpark sparkColor="#f4f4f5" sparkCount={16} sparkRadius={28}>
      <div className="h-screen overflow-y-auto relative text-zinc-100">
        <AmbientStage />
        <div className="relative z-10 min-h-full flex items-center justify-center p-6 md:p-12">
          <div className="max-w-4xl w-full space-y-12 py-10">
            <div className="space-y-5 max-w-2xl">
              <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">AAGAM</p>
              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.08]">
                <SplitReveal text="Give us a problem, not a workflow." />
              </h1>
              <p className="text-lg text-zinc-400 leading-relaxed">
                Agents, traces, and model routers already exist. The missing job is the closed loop:
                who works, at what cost, was it worth it, and should the architecture change.
              </p>
              <Magnet strength={16} className="inline-flex">
                <StarBorder className="rounded-2xl inline-flex">
                  <button
                    type="button"
                    onClick={onEnter}
                    className="btn-solid px-8 py-3.5 rounded-2xl text-base inline-flex items-center gap-2"
                  >
                    Go to AAGAM
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </StarBorder>
              </Magnet>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              {PILLARS.map((p, i) => (
                <motion.div
                  key={p.k}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.08 }}
                  className="rounded-2xl border border-white/12 bg-zinc-950/70 p-5 space-y-2 backdrop-blur-sm"
                >
                  <p className="text-sm text-zinc-500">{p.k}</p>
                  <p className="text-sm text-zinc-200 leading-relaxed">{p.body}</p>
                </motion.div>
              ))}
            </div>

            <div>
              <p className="text-sm text-zinc-500 mb-3">The loop</p>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                {LOOP.map((s, i) => (
                  <motion.div
                    key={s.n}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="rounded-xl border border-white/10 bg-black/40 p-3"
                  >
                    <p className="text-sm text-zinc-500 font-mono">{s.n}</p>
                    <p className="text-base font-medium mt-1">{s.label}</p>
                    <p className="text-sm text-zinc-400 mt-1 leading-snug">{s.line}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClickSpark>
  );
}
