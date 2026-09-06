'use client';

import { useRunStore } from '@/stores/run-store';

export default function Sidebar() {
  const status = useRunStore(s => s.status);
  const taskGoal = useRunStore(s => s.taskGoal);
  const versions = useRunStore(s => s.versions);
  const currentVersion = useRunStore(s => s.currentVersion);
  const benchmarkMode = useRunStore(s => s.benchmarkMode);
  const startBenchmark = useRunStore(s => s.startBenchmark);

  return (
    <aside className="app-sidebar">
      {/* Brand */}
      <div style={{ padding: '4px 16px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-accent-light)', textTransform: 'uppercase' }}>
          Agent Resource
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
          Exchange
        </div>
      </div>

      {/* Project Navigation */}
      <div className="section-label" style={{ marginTop: 12 }}>Run Status</div>
      <div className={`nav-item ${status === 'idle' ? 'active' : ''}`}>
        <span>◆</span> Standby
      </div>
      {status !== 'idle' && (
        <div className={`nav-item ${status === 'running' ? 'active' : ''}`}>
          <span>{status === 'running' ? '⟳' : status === 'completed' ? '✓' : '✗'}</span>
          {status === 'running' ? 'Executing Workflow' : status === 'completed' ? 'Run Complete' : 'Run Failed'}
        </div>
      )}

      {/* Current Task */}
      {taskGoal && (
        <>
          <div className="section-label" style={{ marginTop: 16 }}>Active Task</div>
          <div style={{
            padding: '6px 16px',
            fontSize: 11,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.4,
          }}>
            {taskGoal.length > 90 ? taskGoal.substring(0, 90) + '...' : taskGoal}
          </div>
        </>
      )}

      {/* Benchmarks Section */}
      <div className="section-label" style={{ marginTop: 16 }}>Benchmark Modes</div>
      <button
        onClick={() => startBenchmark('FULL')}
        disabled={status === 'running'}
        className={`nav-item ${benchmarkMode === 'FULL' && status !== 'idle' ? 'active' : ''}`}
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ color: '#10b981' }}>⚡</span>
        <div style={{ flex: 1 }}>
          <div>FULL Evolution</div>
          <div style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>V1 → Mutation → V2</div>
        </div>
      </button>

      <button
        onClick={() => startBenchmark('RESOURCE_ONLY')}
        disabled={status === 'running'}
        className={`nav-item ${benchmarkMode === 'RESOURCE_ONLY' && status !== 'idle' ? 'active' : ''}`}
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ color: '#6366f1' }}>⚙</span>
        <div style={{ flex: 1 }}>
          <div>Resource Only</div>
          <div style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>Realloc, Fixed Arch</div>
        </div>
      </button>

      <button
        onClick={() => startBenchmark('BASELINE')}
        disabled={status === 'running'}
        className={`nav-item ${benchmarkMode === 'BASELINE' && status !== 'idle' ? 'active' : ''}`}
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ color: 'var(--color-text-muted)' }}>📊</span>
        <div style={{ flex: 1 }}>
          <div>Baseline</div>
          <div style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>Fixed Architecture</div>
        </div>
      </button>

      {/* Architectures */}
      {versions.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: 16 }}>Architecture History</div>
          {versions.map((v, i) => (
            <div
              key={i}
              className={`nav-item ${v.version === currentVersion ? 'active' : ''}`}
            >
              <span style={{ color: v.version === currentVersion ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                {v.version === currentVersion ? '●' : '○'}
              </span>
              <span>V{v.version}</span>
              <span style={{
                marginLeft: 'auto',
                fontSize: 10,
                color: 'var(--color-text-muted)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {v.agents} agents · ${(v.quality * 100).toFixed(0)}% Q
              </span>
            </div>
          ))}
        </>
      )}

      {/* Status footer */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '12px 16px',
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-surface-1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
          <span
            className={`status-dot ${status === 'running' ? 'running' : status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'pending'}`}
          />
          <span style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
            {status}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--color-text-muted)' }}>
            v{currentVersion || 1}
          </span>
        </div>
      </div>
    </aside>
  );
}
