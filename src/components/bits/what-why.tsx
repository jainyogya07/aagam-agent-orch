export function WhatWhy({
  what,
  why,
  stacked = false,
}: {
  what: string;
  why: string;
  stacked?: boolean;
}) {
  return (
    <div className={stacked ? 'space-y-3' : 'grid md:grid-cols-2 gap-3'}>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-1.5">
        <p className="text-sm text-zinc-500">What it is</p>
        <p className="text-base text-zinc-100 leading-relaxed">{what}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-1.5">
        <p className="text-sm text-zinc-500">Why it exists</p>
        <p className="text-base text-zinc-200 leading-relaxed">{why}</p>
      </div>
    </div>
  );
}
