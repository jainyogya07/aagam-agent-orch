'use client';

import { useState } from 'react';
import { useRunStore } from '@/stores/run-store';

interface TaskFormProps {
  onClose: () => void;
}

const PRESETS = [
  {
    name: 'Startup Due Diligence (Benchmark)',
    icon: '🚀',
    goal: 'Determine whether this startup idea is commercially viable. Identify competitors, estimate market opportunity, identify key risks, validate important claims, and produce a recommendation.',
    budget: 0.50,
    deadline: 60,
    reliability: 0.90,
  },
  {
    name: 'Software Migration',
    icon: '⚡',
    goal: 'Determine how to migrate this application from framework A to framework B within 2 weeks.',
    budget: 0.50,
    deadline: 60,
    reliability: 0.90,
  },
  {
    name: 'Research Investigation',
    icon: '🔬',
    goal: 'Determine whether a scientific claim is supported by available evidence.',
    budget: 0.50,
    deadline: 60,
    reliability: 0.90,
  },
];

export default function TaskForm({ onClose }: TaskFormProps) {
  const [goal, setGoal] = useState(PRESETS[0].goal);
  const [budget, setBudget] = useState(0.50);
  const [deadline, setDeadline] = useState(60);
  const [reliability, setReliability] = useState(0.90);
  const [benchmarkMode, setBenchmarkMode] = useState<'FULL' | 'RESOURCE_ONLY' | 'BASELINE'>('FULL');
  const [loading, setLoading] = useState(false);

  const startRun = useRunStore(s => s.startRun);

  const applyPreset = (p: typeof PRESETS[number]) => {
    setGoal(p.goal);
    setBudget(p.budget);
    setDeadline(p.deadline);
    setReliability(p.reliability);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || loading) return;

    setLoading(true);
    onClose();

    await startRun({
      goal: goal.trim(),
      budget,
      deadlineSeconds: deadline,
      reliabilityTarget: reliability,
      benchmarkMode,
    });

    setLoading(false);
  };

  return (
    <div className="task-form-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="task-form" onSubmit={handleSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>New Task & Benchmark</h2>
            <p className="subtitle">Define goal, scarce budget constraints, and execution mode</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: 18,
              cursor: 'pointer',
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Benchmark Mode Selector */}
        <div style={{ marginBottom: 18 }}>
          <label className="form-label">Execution & Benchmark Mode</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { id: 'FULL' as const, label: 'FULL (V1 → V2)', desc: 'Dynamic Alloc + Mutation' },
              { id: 'RESOURCE_ONLY' as const, label: 'RESOURCE ONLY', desc: 'Reallocation, Fixed Arch' },
              { id: 'BASELINE' as const, label: 'BASELINE', desc: 'Fixed Arch, No Realloc' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setBenchmarkMode(m.id)}
                style={{
                  background: benchmarkMode === m.id ? 'rgba(99, 102, 241, 0.2)' : 'var(--color-surface-2)',
                  border: benchmarkMode === m.id ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: benchmarkMode === m.id ? 'var(--color-accent-light)' : 'var(--color-text-primary)' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {m.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Demo Presets */}
        <div style={{ marginBottom: 16 }}>
          <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Canonical Use Cases</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                style={{
                  background: goal === p.goal ? 'rgba(99, 102, 241, 0.15)' : 'var(--color-surface-2)',
                  border: goal === p.goal ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                  {p.icon} {p.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                  ${p.budget.toFixed(2)} • {p.deadline}s • {(p.reliability * 100).toFixed(0)}%
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Task / Goal</label>
          <textarea
            className="form-input"
            placeholder="Determine whether this startup idea is commercially viable..."
            value={goal}
            onChange={e => setGoal(e.target.value)}
            required
            rows={3}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Maximum Budget
              <span className="form-slider-value">${budget.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0.25"
              max="2.00"
              step="0.05"
              value={budget}
              onChange={e => setBudget(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Maximum Time
              <span className="form-slider-value">{deadline}s</span>
            </label>
            <input
              type="range"
              min="20"
              max="180"
              step="5"
              value={deadline}
              onChange={e => setDeadline(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Minimum Reliability
            <span className="form-slider-value">{(reliability * 100).toFixed(0)}%</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="0.99"
            step="0.01"
            value={reliability}
            onChange={e => setReliability(Number(e.target.value))}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={!goal.trim() || loading}>
          {loading ? 'Initializing Run...' : `▶ EXECUTE [${benchmarkMode}]`}
        </button>
      </form>
    </div>
  );
}
