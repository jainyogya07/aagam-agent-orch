'use client';

import { ChevronDown } from 'lucide-react';

export function ScrollHint({
  label = 'Scroll — see the simple loop',
  onClick,
}: {
  label?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-auto flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors"
    >
      <span className="text-sm">{label}</span>
      <ChevronDown className="w-6 h-6 anim-scroll-hint" />
    </button>
  );
}
