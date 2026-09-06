'use client';

import { useEffect, useRef } from 'react';
import { useRunStore } from '@/stores/run-store';

export default function ExecutionTerminal() {
  const logs = useRunStore(s => s.logs);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="app-terminal" ref={scrollRef}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
        paddingBottom: 6,
        borderBottom: '1px solid var(--color-border-subtle)',
      }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Execution Log
        </span>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
          {logs.length} events
        </span>
      </div>

      {logs.length === 0 && (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 12, padding: '8px 0' }}>
          {'>'} Waiting for task...
        </div>
      )}

      {logs.map((log, i) => (
        <div key={i} className={`log-line ${log.level}`}>
          <span className="timestamp">{formatTime(log.timestamp)}</span>
          <span>{log.level === 'warn' ? '⚠ ' : log.level === 'error' ? '✗ ' : '› '}</span>
          {log.message}
        </div>
      ))}
    </div>
  );
}
