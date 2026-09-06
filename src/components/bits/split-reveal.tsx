'use client';

import { motion } from 'framer-motion';

export function SplitReveal({
  text,
  className = '',
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  return (
    <span className={`inline-flex flex-wrap ${className}`}>
      {text.split(' ').map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + i * 0.045, duration: 0.38 }}
          className="mr-[0.28em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
