'use client';

import { useState } from 'react';
import { useRunStore } from '@/stores/run-store';
import Sidebar from '@/components/sidebar/sidebar';
import ArchitectureCanvas from '@/components/canvas/architecture-canvas';
import ResourcePanel from '@/components/resource-panel/resource-panel';
import ExecutionTerminal from '@/components/terminal/execution-terminal';
import TaskForm from '@/components/task-form/task-form';

export default function Home() {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const status = useRunStore(s => s.status);
  const finalQuality = useRunStore(s => s.finalQuality);
  const finalReliability = useRunStore(s => s.finalReliability);
  const stopReason = useRunStore(s => s.stopReason);
  const reset = useRunStore(s => s.reset);
  const startBenchmark = useRunStore(s => s.startBenchmark);

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, color: 'var(--color-accent-light)' }}>⬡</span>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.02em' }}>
            Agent Resource Exchange
          </span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Status pills */}
          {status === 'running' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(99, 102, 241, 0.1)', padding: '4px 10px',
              borderRadius: 20, fontSize: 11, color: 'var(--color-accent-light)',
            }}>
              <span className="status-dot running" /> Executing...
            </div>
          )}
          {status === 'completed' && finalQuality !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 11, color: 'var(--color-text-secondary)',
            }}>
              <span style={{
                background: 'rgba(34, 197, 94, 0.1)', padding: '4px 8px',
                borderRadius: 12, color: 'var(--color-success)',
              }}>
                Quality: {(finalQuality * 100).toFixed(1)}%
              </span>
              {finalReliability !== null && (
                <span style={{
                  background: 'rgba(34, 197, 94, 0.1)', padding: '4px 8px',
                  borderRadius: 12, color: 'var(--color-success)',
                }}>
                  Reliability: {(finalReliability * 100).toFixed(1)}%
                </span>
              )}
            </div>
          )}
          {status === 'failed' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(239, 68, 68, 0.1)', padding: '4px 10px',
              borderRadius: 20, fontSize: 11, color: 'var(--color-danger)',
            }}>
              <span className="status-dot failed" /> Failed
            </div>
          )}

          {/* Action buttons */}
          {status !== 'idle' && (
            <button
              onClick={() => { reset(); }}
              style={{
                background: 'var(--color-surface-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          )}
          <button
            onClick={() => startBenchmark('FULL')}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 6,
              padding: '5px 14px',
              fontSize: 12,
              fontWeight: 600,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
            }}
            disabled={status === 'running'}
            title="Execute deterministic benchmark: V1 redundant work → Reclaim to pool → Reallocate to Verifier → V2 mutation & evaluation"
          >
            <span>⚡</span> Run Benchmark (V1 → V2)
          </button>
          <button
            onClick={() => setShowTaskForm(true)}
            style={{
              background: 'linear-gradient(135deg, var(--color-accent), #4f46e5)',
              border: 'none',
              borderRadius: 6,
              padding: '5px 14px',
              fontSize: 12,
              fontWeight: 600,
              color: 'white',
              cursor: 'pointer',
            }}
            disabled={status === 'running'}
          >
            + Custom Task
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar />

      {/* Center Canvas */}
      <ArchitectureCanvas />

      {/* Right Panel */}
      <ResourcePanel />

      {/* Bottom Terminal */}
      <ExecutionTerminal />

      {/* Task Form Modal */}
      {showTaskForm && <TaskForm onClose={() => setShowTaskForm(false)} />}
    </div>
  );
}
