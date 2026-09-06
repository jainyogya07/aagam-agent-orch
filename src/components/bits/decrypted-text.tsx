'use client';

import { useEffect, useState } from 'react';

const GLYPHS = '01<>/\\|#*+ABCDEF';

export function DecryptedText({
  text,
  className = '',
  speed = 28,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const [out, setOut] = useState('');

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      const revealed = text.slice(0, i);
      const rest = text
        .slice(i)
        .split('')
        .map((ch) => (ch === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
        .join('');
      setOut(revealed + rest);
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [speed, text]);

  return <span className={className}>{out || text}</span>;
}
