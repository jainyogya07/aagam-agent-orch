'use client';

import type { ReactNode } from 'react';

export function StarBorder({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden">
        <span className="absolute inset-[-40%] anim-orbit-border bg-[conic-gradient(from_0deg,transparent_0%,rgba(255,255,255,0.28)_8%,transparent_18%)]" />
      </span>
      <div className="relative rounded-[inherit]">{children}</div>
    </div>
  );
}
