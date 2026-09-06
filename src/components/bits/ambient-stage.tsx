'use client';

import { Aurora } from './aurora';
import { Particles } from './particles';
import { Noise } from './noise';

/** Luma-like dark atmospheric stage: aurora wash + drifting particles + grain. */
export function AmbientStage() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-24 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-white/[0.04] blur-3xl anim-breathe" />
      <div className="absolute bottom-[-120px] right-[-80px] h-[380px] w-[380px] rounded-full bg-white/[0.03] blur-3xl anim-float-slow" />
      <div className="absolute top-[20%] left-[-60px] h-[240px] w-[240px] rounded-full bg-white/[0.025] blur-2xl anim-float-delay" />
      <Aurora colorStops={['#d4d4d8', '#71717a', '#fafafa']} amplitude={1.1} blend={0.6} speed={0.7} />
      <Particles count={64} speed={0.22} />
      <Noise opacity={0.08} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/55" />
    </div>
  );
}
