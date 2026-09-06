'use client';

import { GlareHover } from '@/components/bits/glare-hover';
import { WhatWhy } from '@/components/bits/what-why';
import { Particles } from '@/components/bits/particles';
import { Noise } from '@/components/bits/noise';
import { PROBLEM_CARDS, type ProblemCard } from '@/lib/analysis/problem-catalog';
import { ArrowRight } from 'lucide-react';

export function ProblemCards({
  selectedId,
  onSelect,
  onAnalyze,
}: {
  selectedId: string | null;
  onSelect: (card: ProblemCard) => void;
  onAnalyze?: (card: ProblemCard) => void;
}) {
  const selected = PROBLEM_CARDS.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm text-zinc-400">Try a problem</p>
        <p className="text-base text-zinc-200">Click a card to fill the box. Analyze runs it.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {PROBLEM_CARDS.map((item) => {
          const active = selectedId === item.id;
          return (
            <GlareHover key={item.id} className="rounded-xl">
              <button
                type="button"
                onClick={() => onSelect(item)}
                className={`relative overflow-hidden select-none text-left w-full rounded-xl p-3.5 border transition-all ${
                  active
                    ? 'border-zinc-100 bg-zinc-800 text-zinc-50'
                    : 'border-white/10 bg-zinc-950/50 text-zinc-100 hover:bg-zinc-900'
                }`}
              >
                <Particles count={28} speed={0.18} />
                <Noise opacity={0.06} />
                <div className="relative z-10">
                  <div className={`text-sm mb-0.5 ${active ? 'text-zinc-400' : 'text-zinc-500'}`}>{item.category}</div>
                  <div className="text-base font-medium leading-snug">{item.title}</div>
                </div>
              </button>
            </GlareHover>
          );
        })}
      </div>

      {selected && (
        <div className="rounded-2xl border border-white/15 bg-zinc-950 p-5 space-y-4">
          <div>
            <p className="text-sm text-zinc-400">{selected.category}</p>
            <h3 className="text-xl font-semibold text-zinc-50 mt-0.5">{selected.title}</h3>
          </div>
          <WhatWhy what={selected.what} why={selected.why} />
          <p className="text-base text-zinc-400 leading-relaxed">{selected.extra}</p>
          {onAnalyze && (
            <button
              type="button"
              onClick={() => onAnalyze(selected)}
              className="btn-solid px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2"
            >
              Analyze this problem
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
