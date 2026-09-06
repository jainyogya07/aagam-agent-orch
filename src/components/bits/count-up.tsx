'use client';

import { useEffect, useState } from 'react';

export function CountUp({
  value,
  suffix = '',
  prefix = '',
  digits = 1,
  duration = 900,
  className = '',
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  digits?: number;
  duration?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let id = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(value * eased);
      if (t < 1) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [duration, value]);

  return (
    <span className={className}>
      {prefix}
      {shown.toFixed(digits)}
      {suffix}
    </span>
  );
}
