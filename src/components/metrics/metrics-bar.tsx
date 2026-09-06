'use client';

// ============================================================
// Metrics Bar Component
// ============================================================
// Clean top bar showing real-time metrics during execution.
// Simple scoreboard: Quality | Reliability | Cost | Agents | Sessions
// Click to expand for detailed breakdown.
// ============================================================

import { useState } from 'react';
import { TrendingUp, DollarSign, Users, Database, Zap, X, ChevronDown } from 'lucide-react';

export interface MetricsData {
  quality: number | null;
  reliability: number | null;
  confidence: number | null;
  cost: number;
  agents: number;
  sessions: number;
  version: number;
  qualityBreakdown?: {
    correctness: number;
    evidence: number;
    completeness: number;
    reasoning: number;
    requirementFit: number;
    consistency: number;
    clarity: number;
    uncertainty: number;
  };
}

interface MetricsBarProps {
  metrics: MetricsData;
  phase?: 'idle' | 'running' | 'completed';
}

export function MetricsBar({ metrics, phase = 'running' }: MetricsBarProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const qualityColor = 'text-zinc-100';

  return (
    <>
      <div className="flex items-center gap-5 text-sm flex-wrap justify-end">
        {/* Quality */}
        <MetricItem
          icon={<TrendingUp className="w-4 h-4" />}
          label="Quality"
          value={metrics.quality ? `${(metrics.quality * 100).toFixed(1)}%` : '--'}
          color={qualityColor}
          onClick={() => metrics.qualityBreakdown && setShowBreakdown(true)}
          clickable={!!metrics.qualityBreakdown}
        />

        {metrics.confidence !== null && (
          <MetricItem
            label="Confidence"
            value={`${(metrics.confidence * 100).toFixed(1)}%`}
            color="text-zinc-100"
          />
        )}

        {metrics.reliability !== null && (
          <MetricItem
            label="Reliability"
            value={`${(metrics.reliability * 100).toFixed(1)}%`}
            color="text-zinc-100"
          />
        )}

        {/* Cost */}
        <MetricItem
          icon={<DollarSign className="w-4 h-4" />}
          label="Cost"
          value={`$${metrics.cost.toFixed(3)}`}
          color="text-white"
        />

        {/* Version */}
        <MetricItem
          icon={<Zap className="w-4 h-4" />}
          label="Version"
          value={`V${metrics.version}`}
          color="text-zinc-100"
        />

        {/* Agents */}
        <MetricItem
          icon={<Users className="w-4 h-4" />}
          label="Agents"
          value={`${metrics.agents}`}
          color="text-gray-400"
        />

        {/* Sessions */}
        <MetricItem
          icon={<Database className="w-4 h-4" />}
          label="Sessions"
          value={`${metrics.sessions}`}
          color="text-gray-400"
        />

        {/* Live indicator */}
        {phase === 'running' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/15">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span className="text-sm text-zinc-200 font-medium">Live</span>
          </div>
        )}
      </div>

      {/* Quality Breakdown Modal */}
      {showBreakdown && metrics.qualityBreakdown && (
        <QualityBreakdownModal
          breakdown={metrics.qualityBreakdown}
          overallQuality={metrics.quality ?? 0}
          onClose={() => setShowBreakdown(false)}
        />
      )}
    </>
  );
}

function MetricItem({
  icon,
  label,
  value,
  color,
  onClick,
  clickable,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  color: string;
  onClick?: () => void;
  clickable?: boolean;
}) {
  const content = (
    <>
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-gray-500">{icon}</span>}
        <span className="text-gray-500">{label}</span>
      </div>
      <span className={`font-semibold ${color}`}>{value}</span>
    </>
  );

  if (clickable && onClick) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-2 hover:bg-[#111116] px-2 py-1 rounded transition-colors group"
      >
        {content}
        <ChevronDown className="w-3 h-3 text-gray-600 group-hover:text-gray-400" />
      </button>
    );
  }

  return <div className="flex items-center gap-2">{content}</div>;
}

function QualityBreakdownModal({
  breakdown,
  overallQuality,
  onClose,
}: {
  breakdown: MetricsData['qualityBreakdown'];
  overallQuality: number;
  onClose: () => void;
}) {
  if (!breakdown) return null;

  const dimensions = [
    { key: 'correctness', label: 'Correctness', weight: 0.25 },
    { key: 'evidence', label: 'Evidence', weight: 0.20 },
    { key: 'completeness', label: 'Completeness', weight: 0.15 },
    { key: 'reasoning', label: 'Reasoning', weight: 0.15 },
    { key: 'requirementFit', label: 'Requirement Fit', weight: 0.10 },
    { key: 'consistency', label: 'Consistency', weight: 0.05 },
    { key: 'clarity', label: 'Clarity', weight: 0.05 },
    { key: 'uncertainty', label: 'Uncertainty', weight: 0.05 },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-[#111116] border border-[#24242C] rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#24242C] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Quality Breakdown</h2>
              <p className="text-sm text-gray-500 mt-1">8-dimensional quality assessment</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#18181f] rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Overall Score */}
          <div className="px-6 py-4 border-b border-[#24242C]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Overall Quality Score</span>
              <span className="text-2xl font-bold text-emerald-400">
                {(overallQuality * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-[#0B0B0F] rounded-full h-3">
              <div
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${overallQuality * 100}%` }}
              />
            </div>
          </div>

          {/* Dimensions */}
          <div className="p-6 space-y-4">
            {dimensions.map(({ key, label, weight }) => {
              const score = breakdown[key as keyof typeof breakdown];
              const passed = score >= 0.95;
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{label}</span>
                      <span className="text-xs text-gray-600">
                        ({(weight * 100).toFixed(0)}% weight)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${
                        passed ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {(score * 100).toFixed(0)}%
                      </span>
                      {passed ? (
                        <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center">
                          <span className="text-emerald-400 text-xs">✓</span>
                        </div>
                      ) : (
                        <div className="w-5 h-5 bg-amber-500/10 rounded-full flex items-center justify-center">
                          <span className="text-amber-400 text-xs">!</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-[#0B0B0F] rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        passed ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${score * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Threshold Info */}
          <div className="px-6 py-4 border-t border-[#24242C] bg-[#0B0B0F]">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Quality Threshold</span>
              <span className="font-medium">95.0%</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
