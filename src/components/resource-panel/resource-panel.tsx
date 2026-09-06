'use client';

import { useRunStore } from '@/stores/run-store';

export default function ResourcePanel() {
  const runId = useRunStore(s => s.runId);
  const neatlogsUrl = useRunStore(s => s.neatlogsUrl);
  const resources = useRunStore(s => s.resources);
  const nodes = useRunStore(s => s.nodes);
  const reallocations = useRunStore(s => s.reallocations);
  const reclaims = useRunStore(s => s.reclaims);
  const versions = useRunStore(s => s.versions);
  const status = useRunStore(s => s.status);
  const benchmarkMode = useRunStore(s => s.benchmarkMode);
  const qualityGateStatus = useRunStore(s => s.qualityGateStatus);
  const qualityDimensions = useRunStore(s => s.qualityDimensions);
  const repairs = useRunStore(s => s.repairs);
  const verifiedClaimsRatio = useRunStore(s => s.verifiedClaimsRatio);
  const finalQuality = useRunStore(s => s.finalQuality);
  const finalReliability = useRunStore(s => s.finalReliability);

  const budgetPercent = resources.totalBudget > 0
    ? (resources.spent / resources.totalBudget) * 100
    : 0;

  // Calculate v1 vs v2 deltas if both exist
  const v1 = versions.length > 0 ? versions[0] : null;
  const v2 = versions.length > 1 ? versions[versions.length - 1] : null;

  return (
    <div className="app-panel">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="section-label" style={{ padding: 0 }}>Resource Exchange</div>
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.06em',
          padding: '2px 6px',
          borderRadius: 4,
          background: 'rgba(99, 102, 241, 0.15)',
          color: 'var(--color-accent-light)',
          textTransform: 'uppercase',
        }}>
          {benchmarkMode} MODE
        </span>
      </div>

      {/* Neatlogs Observability Bridge */}
      {neatlogsUrl && (
        <a
          href={neatlogsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="neatlogs-deep-link"
          title="Neatlogs answers: What happened inside the agent run? | Resource Exchange answers: Where should the next unit of scarce resources go?"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>📡</span>
            <div>
              <div>OPEN TRACE IN NEATLOGS</div>
              <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 400 }}>
                Trace hierarchy • Tool spans • LLM logs
              </div>
            </div>
          </div>
          <span style={{ fontSize: 12 }}>↗</span>
        </a>
      )}

      {/* Budget overview */}
      <div className="metric-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div className="metric-label">Total Budget</div>
            <div className="metric-value">${resources.totalBudget.toFixed(2)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="metric-label">Remaining Pool</div>
            <div className={`metric-value ${resources.remaining < resources.totalBudget * 0.2 ? 'warning' : 'success'}`}>
              ${Math.max(0, resources.remaining).toFixed(2)}
            </div>
          </div>
        </div>
        <div className="alloc-bar">
          <div className="alloc-bar-fill" style={{ width: `${Math.min(100, budgetPercent)}%` }} />
        </div>
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4, textAlign: 'right' }}>
          ${resources.spent.toFixed(4)} spent ({budgetPercent.toFixed(1)}%)
        </div>
      </div>

      {/* Time Constraint */}
      <div className="metric-card">
        <div className="metric-label">Time Constraint</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span className="metric-value" style={{ fontSize: 18 }}>
            {resources.timeDeadline > 0 ? `${resources.timeDeadline}s` : '—'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>hard deadline</span>
        </div>
      </div>

      {/* Visual Resource Movement Pipeline */}
      {(reclaims.length > 0 || reallocations.length > 0) && (
        <div style={{ marginTop: 16 }}>
          <div className="section-label" style={{ padding: '0 0 6px 0', display: 'flex', justifyContent: 'space-between' }}>
            <span>Resource Movement</span>
            <span style={{ color: 'var(--color-accent-light)', textTransform: 'none', fontWeight: 500 }}>Live Transaction</span>
          </div>

          <div className="resource-transaction-card">
            {/* Step 1: Reclaim */}
            {reclaims.map((rc, idx) => (
              <div key={`rc-${idx}`} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="reclaim-badge">
                    🔻 RECLAIM -${rc.amount.toFixed(4)}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {rc.agentName}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2, fontStyle: 'italic' }}>
                  {rc.reason}
                </div>
              </div>
            ))}

            {/* Step 2: Pool Movement */}
            <div className="transaction-flow-arrow">
              <span style={{ fontSize: 11 }}>↓ Unused allocation returns to Pool</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '4px 8px',
              background: 'rgba(59, 130, 246, 0.08)',
              borderRadius: 6,
              border: '1px dashed rgba(59, 130, 246, 0.3)',
              marginBottom: 6,
            }}>
              <span className="pool-badge">🏦 RESOURCE POOL</span>
              <span style={{ fontSize: 11, color: '#93c5fd', fontWeight: 600 }}>
                +${(reclaims.reduce((acc, r) => acc + r.amount, 0)).toFixed(4)} available for high-marginal agents
              </span>
            </div>

            {/* Step 3: Reallocate */}
            <div className="transaction-flow-arrow">
              <span style={{ fontSize: 11 }}>↓ Directed to higher-value capability</span>
            </div>
            {reallocations.map((ra, idx) => (
              <div key={`ra-${idx}`} style={{
                background: 'rgba(34, 197, 94, 0.06)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: 6,
                padding: '6px 8px',
                marginTop: 4,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="reallocate-badge">
                    🟢 REALLOCATE +${ra.amount.toFixed(4)}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    → {ra.toAgent}
                  </span>
                </div>
                {ra.expectedBenefit && (
                  <div style={{ fontSize: 10, color: '#4ade80', fontWeight: 600, marginTop: 3 }}>
                    ⚡ {ra.expectedBenefit}
                  </div>
                )}
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {ra.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Institutional Quality Gate (Target >= 95%) */}
      {(qualityGateStatus || qualityDimensions || finalQuality !== null) && (
        <div style={{ marginTop: 16 }}>
          <div className="section-label" style={{ padding: '0 0 6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Quality Gate (Target ≥ 95%)</span>
            {qualityGateStatus === 'PASSED' ? (
              <span className="quality-badge-passed">✓ GATE PASSED</span>
            ) : qualityGateStatus === 'DEFECTS_DETECTED' ? (
              <span className="quality-badge-defects">⚠️ REPAIR ENGAGED</span>
            ) : null}
          </div>

          <div className={`quality-gate-card ${qualityGateStatus === 'PASSED' ? 'passed' : qualityGateStatus === 'DEFECTS_DETECTED' ? 'defects' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Institutional Rubric Score
              </span>
              <span style={{
                fontSize: 13,
                fontWeight: 800,
                color: (finalQuality || 0) >= 0.95 ? 'var(--color-success)' : (finalQuality || 0) >= 0.85 ? '#93c5fd' : 'var(--color-warning)'
              }}>
                {finalQuality !== null ? `${(finalQuality * 100).toFixed(1)}%` : 'Evaluating...'}
              </span>
            </div>

            {verifiedClaimsRatio !== null && (
              <div style={{
                fontSize: 10,
                color: verifiedClaimsRatio >= 0.95 ? 'var(--color-success)' : 'var(--color-text-secondary)',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <span>🛡️ Critical Claims Verified:</span>
                <strong>{(verifiedClaimsRatio * 100).toFixed(1)}%</strong>
              </div>
            )}

            {/* 8 Dimension Mini Breakdown */}
            {qualityDimensions && (
              <div className="dimension-mini-grid">
                {Object.entries({
                  correctness: 'Correctness (25%)',
                  evidence: 'Evidence (20%)',
                  completeness: 'Completeness (15%)',
                  reasoning: 'Reasoning (15%)',
                  requirementFit: 'Req Fit (10%)',
                  consistency: 'Consistency (5%)',
                  clarity: 'Clarity (5%)',
                  uncertainty: 'Uncertainty (5%)',
                }).map(([dimKey, label]) => {
                  const val = qualityDimensions[dimKey] ?? 0;
                  return (
                    <div key={dimKey} className="dimension-mini-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--color-text-muted)', marginBottom: 2 }}>
                        <span>{label}</span>
                        <span style={{ color: val >= 0.95 ? 'var(--color-success)' : val >= 0.85 ? 'var(--color-accent-light)' : 'var(--color-warning)', fontWeight: 600 }}>
                          {(val * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="alloc-bar" style={{ height: 3, margin: 0 }}>
                        <div
                          className="alloc-bar-fill"
                          style={{
                            width: `${Math.min(100, val * 100)}%`,
                            background: val >= 0.95 ? 'var(--color-success)' : val >= 0.85 ? 'var(--color-accent)' : 'var(--color-warning)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Targeted Repairs */}
            {repairs && repairs.length > 0 && (
              <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Targeted Repair Rounds ({repairs.length})
                </div>
                {repairs.map((r, i) => (
                  <div key={i} className="repair-pill">
                    Round {r.round}: Addressed {r.weakestDimension} → Post-repair quality {(r.quality * 100).toFixed(1)}%
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Architecture Evolution (V1 vs V2) */}
      {versions.length > 1 && v1 && v2 && (
        <div style={{ marginTop: 16 }}>
          <div className="section-label" style={{ padding: '0 0 6px 0' }}>Architecture Evolution</div>
          <div style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                V1 vs V2 Measured Metrics
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                color: v2.quality >= v1.quality ? 'var(--color-success)' : 'var(--color-warning)',
              }}>
                {v2.quality >= v1.quality ? '✓ V2 Outperforms V1' : 'V1 Kept'}
              </span>
            </div>

            <div className="comparison-grid">
              {/* V1 Column */}
              <div className="comparison-column">
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                  V1 (INITIAL)
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
                  Agents: <strong>{v1.agents}</strong>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
                  Cost: <strong>${v1.cost.toFixed(4)}</strong>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
                  Quality: <strong>{(v1.quality * 100).toFixed(1)}%</strong>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
                  Reliability: <strong>{(v1.reliability * 100).toFixed(1)}%</strong>
                </div>
                {v1.evidence !== undefined && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    Evidence: <strong>{(v1.evidence * 100).toFixed(1)}%</strong>
                  </div>
                )}
              </div>

              {/* V2 Column */}
              <div className="comparison-column v2">
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-accent-light)', marginBottom: 4 }}>
                  V2 (EVOLVED)
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                  Agents: <strong>{v2.agents}</strong>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                  Cost: <strong>${v2.cost.toFixed(4)}</strong>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                  Quality: <strong>{(v2.quality * 100).toFixed(1)}%</strong>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                  Reliability: <strong>{(v2.reliability * 100).toFixed(1)}%</strong>
                </div>
                {v2.evidence !== undefined && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-primary)' }}>
                    Evidence: <strong>{(v2.evidence * 100).toFixed(1)}%</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Net Differentiator Deltas */}
            <div style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}>
              <span className={`delta-pill ${v2.quality >= v1.quality ? 'positive' : 'negative'}`}>
                Quality {v2.quality >= v1.quality ? '+' : ''}{((v2.quality - v1.quality) * 100).toFixed(1)}%
              </span>
              <span className={`delta-pill ${v2.cost <= v1.cost ? 'positive' : 'negative'}`}>
                Cost {v2.cost <= v1.cost ? '-' : '+'}${Math.abs(v2.cost - v1.cost).toFixed(4)}
              </span>
              <span className={`delta-pill ${v2.reliability >= v1.reliability ? 'positive' : 'negative'}`}>
                Reliability {v2.reliability >= v1.reliability ? '+' : ''}{((v2.reliability - v1.reliability) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Agent Allocations List */}
      {nodes.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: 16 }}>Agent Allocations</div>
          {nodes.map(node => (
            <div key={node.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  {node.name}
                </span>
                <span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-secondary)' }}>
                  ${(node.cost || 0).toFixed(4)}
                </span>
              </div>
              <div className="alloc-bar">
                <div
                  className="alloc-bar-fill"
                  style={{
                    width: `${resources.totalBudget > 0 ? Math.min(100, ((node.cost || 0) / resources.totalBudget) * 100 * 5) : 0}%`,
                    background: node.status === 'COMPLETED'
                      ? 'var(--color-success)'
                      : node.status === 'RUNNING'
                        ? 'linear-gradient(90deg, var(--color-accent), var(--color-accent-light))'
                        : node.status === 'FAILED'
                          ? 'var(--color-danger)'
                          : 'var(--color-surface-4)',
                  }}
                />
              </div>
              {node.contribution !== undefined && (
                <div style={{
                  fontSize: 10,
                  color: node.contribution > 0.1 ? 'var(--color-success)' : node.contribution < 0.03 ? 'var(--color-warning)' : 'var(--color-text-muted)',
                  marginTop: 2,
                }}>
                  Contribution: +{(node.contribution * 100).toFixed(1)}%
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Empty state */}
      {nodes.length === 0 && status === 'idle' && (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 32, opacity: 0.2, marginBottom: 8 }}>⚡</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Start a task or benchmark to observe<br />dynamic resource allocation & mutation
          </div>
        </div>
      )}
    </div>
  );
}
