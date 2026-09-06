'use client';

import React, { useCallback, useEffect, useRef } from 'react';

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

export function ClickSpark({
  sparkColor = '#f4f4f5',
  sparkSize = 9,
  sparkRadius = 22,
  sparkCount = 12,
  duration = 420,
  extraScale = 1.15,
  children,
}: {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  extraScale?: number;
  children?: React.ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationId = 0;

    const draw = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) return false;
        const eased = elapsed / duration;
        const ease = eased * (2 - eased);
        const distance = ease * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - ease);
        ctx.strokeStyle = sparkColor;
        ctx.globalAlpha = 1 - eased;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(spark.x + distance * Math.cos(spark.angle), spark.y + distance * Math.sin(spark.angle));
        ctx.lineTo(
          spark.x + (distance + lineLength) * Math.cos(spark.angle),
          spark.y + (distance + lineLength) * Math.sin(spark.angle)
        );
        ctx.stroke();
        ctx.globalAlpha = 1;
        return true;
      });
      animationId = requestAnimationFrame(draw);
    };
    animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [duration, extraScale, sparkColor, sparkRadius, sparkSize]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const now = performance.now();
      sparksRef.current.push(
        ...Array.from({ length: sparkCount }, (_, i) => ({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          angle: (2 * Math.PI * i) / sparkCount + Math.random() * 0.2,
          startTime: now,
        }))
      );
    },
    [sparkCount]
  );

  return (
    <div className="relative w-full h-full min-h-screen" onClick={handleClick}>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-50" />
      {children}
    </div>
  );
}
