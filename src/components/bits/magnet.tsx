'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';

export function Magnet({
  children,
  strength = 18,
  className = '',
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={`will-change-transform ${className}`}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * strength;
        const y = ((e.clientY - r.top) / r.height - 0.5) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      }}
      onMouseLeave={() => {
        if (ref.current) ref.current.style.transform = 'translate(0, 0)';
      }}
      style={{ transition: 'transform 180ms ease-out' }}
    >
      {children}
    </div>
  );
}
