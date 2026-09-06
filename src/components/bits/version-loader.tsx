'use client';

import { motion } from 'framer-motion';

const V1_STEPS = ['understand', 'architect', 'allocate', 'execute', 'score'];
const V2_STEPS = ['measure', 'reclaim', 'mutate', 'run again', 'gate'];

export function VersionLoader({
  label,
  note,
}: {
  label: 'V1' | 'V2';
  note: string;
}) {
  const steps = label === 'V1' ? V1_STEPS : V2_STEPS;

  return (
    <div className="rounded-xl border border-white/15 bg-zinc-950 p-5 space-y-5 overflow-hidden relative anim-glow-soft">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
        <motion.div
          className="h-40 w-40 rounded-full border border-white/15"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute h-28 w-28 rounded-full border border-dashed border-white/20"
          animate={{ rotate: -360 }}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute h-16 w-16 rounded-full border border-white/30"
          animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="absolute top-1/2 left-1/2 h-2 w-2 -ml-1 -mt-20 rounded-full bg-zinc-100"
          animate={{ rotate: 360 }}
          style={{ transformOrigin: '4px 80px' }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-zinc-500 uppercase tracking-[0.18em]">{label} loading</p>
          <p className="text-lg font-semibold text-zinc-50">{note}</p>
          <p className="text-sm text-zinc-400">
            {label === 'V1'
              ? 'First team is being designed, reserved, and run. This is not a spinner — it is the loop warming up.'
              : 'Contribution is being measured. V2 only appears if expected value is positive.'}
          </p>
        </div>
        <span className="text-sm px-2.5 py-1 rounded-full border border-white/20 anim-pulse-ring shrink-0">
          running
        </span>
      </div>

      <div className="relative space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-2.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-white/10 via-white/50 to-white/10"
              animate={{ x: ['-40%', '140%'] }}
              transition={{ duration: 1.35 + i * 0.12, repeat: Infinity, ease: 'linear', delay: i * 0.1 }}
              style={{ width: '38%' }}
            />
          </div>
        ))}
      </div>

      <div className="relative flex flex-wrap gap-2">
        {steps.map((s, i) => (
          <motion.span
            key={s}
            animate={{
              opacity: [0.35, 1, 0.35],
              borderColor: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0.12)'],
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.22 }}
            className="px-2.5 py-1 rounded-full border text-sm text-zinc-200"
          >
            {s}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
