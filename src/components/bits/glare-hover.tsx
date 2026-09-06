'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';

export function GlareHover({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden group ${className}`}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`);
        el.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`);
      }}
    >
      {children}
      <span
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(420px circle at var(--gx, 50%) var(--gy, 50%), rgba(255,255,255,0.16), transparent 42%)',
        }}
      />
    </div>
  );
}
