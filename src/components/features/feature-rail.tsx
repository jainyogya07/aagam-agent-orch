'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AAGAM_FEATURES } from '@/lib/analysis/feature-catalog';
import { GlareHover } from '@/components/bits/glare-hover';
import { WhatWhy } from '@/components/bits/what-why';

const DETAIL: Record<string, { what: string; why: string }> = {
  f01: { what: 'You type the problem in ordinary English.', why: 'You should not have to design a workflow first.' },
  f02: { what: 'The system pulls out the real objective from the sentence.', why: 'Agents cannot be funded against a vague paragraph.' },
  f03: { what: 'It guesses the industry from the goal.', why: 'Health, climate, and finance need different specialists.' },
  f04: { what: 'It guesses geography (India, DACH, APAC…).', why: 'Regulation and unit economics are place-specific.' },
  f05: { what: 'Must-haves are split from defaults.', why: 'Defaults should not be billed as constraints.' },
  f06: { what: 'The orchestrator designs the team.', why: 'You do not pick agents. That is the product.' },
  f07: { what: 'Each person on the team gets a specialist role.', why: 'A generic chatbot cannot earn a budget.' },
  f08: { what: 'A tool is bought only if it is expected to pay.', why: 'Capability spend is a resource decision, not a default.' },
  f09: { what: 'The right model is chosen per specialist.', why: 'Expensive reasoning is allocated, not sprayed.' },
  f10: { what: 'If a provider fails, another is used.', why: 'A run should not die because one API blinked.' },
};

export function FeatureRail() {
  const [selected, setSelected] = useState<string | null>(null);
  const loop = [...AAGAM_FEATURES, ...AAGAM_FEATURES];
  const picked = selected ? AAGAM_FEATURES.find((f) => f.id === selected) : null;
  const detail = selected ? DETAIL[selected] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-400">What the loop does</p>
          <p className="text-base text-zinc-200">Click a card to audit that step — text stays readable.</p>
        </div>
        <p className="text-sm text-zinc-500">{picked ? picked.name : 'Click a card'}</p>
      </div>
      <div className="overflow-hidden mask-fade-x">
        <div className="flex gap-2.5 anim-marquee w-max">
          {loop.map((f, i) => (
            <button
              key={`${f.id}-${i}`}
              type="button"
              onClick={() => setSelected(f.id)}
              className={`shrink-0 select-none text-sm px-3.5 py-2 rounded-full border transition-all ${
                selected === f.id
                  ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                  : 'border-white/12 text-zinc-200 hover:border-white/30 bg-transparent'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {AAGAM_FEATURES.slice(0, 10).map((f, i) => (
          <GlareHover key={f.id}>
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelected(f.id)}
              className={`select-none w-full text-left rounded-lg border px-2.5 py-2.5 text-sm leading-snug ${
                selected === f.id
                  ? 'border-zinc-100 bg-zinc-800 text-zinc-50'
                  : 'border-white/10 bg-zinc-950/40 text-zinc-200'
              }`}
            >
              {f.name}
            </motion.button>
          </GlareHover>
        ))}
      </div>
      {picked && (
        <div className="rounded-2xl border border-white/15 bg-zinc-950 p-5 space-y-3">
          <h3 className="text-lg font-semibold text-zinc-50">{picked.name}</h3>
          <WhatWhy
            what={detail?.what ?? `${picked.name} is one step in the closed loop.`}
            why={detail?.why ?? 'Each step exists so the architecture can be funded, scored, and changed — not just drawn.'}
          />
        </div>
      )}
    </div>
  );
}
