'use client';

// ============================================================
// Version Comparison Component
// ============================================================
// Visual comparison of V1 → V2 → V3 architecture evolution.
// Shows the X-factor: quality improvements, resource reallocation,
// agent changes, and mutation decisions that demonstrate
// autonomous architecture evolution.
// ============================================================

import { TrendingUp, TrendingDown, Zap, DollarSign, Users, ArrowRight } from 'lucide-react';

export interface VersionMetrics {
  version: number;
  quality: number;
  reliability: number;
  cost: number;
  agentCount: number;
  sessionCount: number;
  
  // Detailed breakdown
  dimensions?: {
    correctness: number;
    evidence: number;
    completeness: number;
    reasoning: number;
    requirementFit: number;
    consistency: number;
    clarity: number;
    uncertainty: number;
  };
  
  // Resource info
  resourcesReclaimed?: number;
  resourcesReallocated?: number;
  
  // Mutation info
  mutationReason?: string;
  mutationType?: string;
}

interface VersionComparisonProps {
  versions: VersionMetrics[];
  showDetailed?: boolean;
}

export function VersionComparison({ versions, showDetailed = true }: VersionComparisonProps) {
  if (versions.length < 2) {
    return (
      <div className="text-center text-sm text-gray-500">
        No version comparison available (single version run)
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Zap className="w-5 h-5 text-violet-400" />
        <h2 className="text-lg font-semibold text-white">Architecture Evolution</h2>
        <span className="text-sm text-gray-500">
          {versions.length} versions • Autonomous improvement
        </span>
      </div>

      {/* Version Comparisons */}
      <div className="space-y-8">
        {versions.slice(0, -1).map((v1, index) => {
          const v2 = versions[index + 1];
          return (
            <VersionPair
              key={`v${v1.version}-v${v2.version}`}
              v1={v1}
              v2={v2}
              showDetailed={showDetailed}
            />
          );
        })}
      </div>

      {/* Summary */}
      <EvolutionSummary versions={versions} />
    </div>
  );
}

function VersionPair({
  v1,
  v2,
  showDetailed,
}: {
  v1: VersionMetrics;
  v2: VersionMetrics;
  showDetailed: boolean;
}) {
  // Calculate deltas
  const qualityDelta = v2.quality - v1.quality;
  const costDelta = v2.cost - v1.cost;
  const agentDelta = v2.agentCount - v1.agentCount;

  return (
    <div className="space-y-4">
      {/* Main Comparison */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
        {/* V1 Card */}
        <VersionCard version={v1} isOld />

        {/* Arrow */}
        <div className="flex flex-col items-center gap-2">
          <ArrowRight className="w-6 h-6 text-violet-400" />
          <span className="text-xs text-violet-400 font-medium">evolve</span>
        </div>

        {/* V2 Card */}
        <VersionCard version={v2} isNew />
      </div>

      {/* Mutation Info */}
      {v2.mutationReason && (
        <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Zap className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-violet-400">
                  {v2.mutationType || 'Architecture Mutation'}
                </span>
              </div>
              <p className="text-sm text-gray-400">{v2.mutationReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Resource Reallocation */}
      {(v2.resourcesReclaimed || v2.resourcesReallocated) && (
        <div className="bg-[#111116] border border-[#24242C] rounded-lg p-4">
          <div className="text-sm font-medium text-white mb-3">Resource Reallocation</div>
          <div className="grid grid-cols-2 gap-4">
            {v2.resourcesReclaimed && (
              <div className="space-y-1">
                <div className="text-xs text-gray-500">Reclaimed</div>
                <div className="text-lg font-semibold text-amber-400">
                  +${v2.resourcesReclaimed.toFixed(3)}
                </div>
              </div>
            )}
            {v2.resourcesReallocated && (
              <div className="space-y-1">
                <div className="text-xs text-gray-500">Reallocated</div>
                <div className="text-lg font-semibold text-emerald-400">
                  ${v2.resourcesReallocated.toFixed(3)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delta Summary */}
      <div className="grid grid-cols-3 gap-3">
        <DeltaCard
          label="Quality"
          delta={qualityDelta}
          v1Value={v1.quality}
          v2Value={v2.quality}
          format="percent"
          isPositiveGood
        />
        <DeltaCard
          label="Cost"
          delta={costDelta}
          v1Value={v1.cost}
          v2Value={v2.cost}
          format="currency"
          isPositiveGood={false}
        />
        <DeltaCard
          label="Agents"
          delta={agentDelta}
          v1Value={v1.agentCount}
          v2Value={v2.agentCount}
          format="number"
        />
      </div>

      {/* Dimensional Comparison */}
      {showDetailed && v1.dimensions && v2.dimensions && (
        <DimensionalComparison v1Dims={v1.dimensions} v2Dims={v2.dimensions} />
      )}
    </div>
  );
}

function VersionCard({ version, isOld, isNew }: { version: VersionMetrics; isOld?: boolean; isNew?: boolean }) {
  return (
    <div
      className={`border rounded-lg p-4 ${
        isNew
          ? 'bg-emerald-500/5 border-emerald-500/30'
          : isOld
          ? 'bg-[#111116] border-[#24242C]'
          : 'bg-[#111116] border-[#24242C]'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="px-2 py-1 bg-violet-500/10 text-violet-400 text-sm font-semibold rounded border border-violet-500/20">
          V{version.version}
        </span>
        {isNew && (
          <span className="text-xs text-emerald-400 font-medium">✓ Improved</span>
        )}
      </div>

      <div className="space-y-2">
        <MetricRow
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          label="Quality"
          value={`${(version.quality * 100).toFixed(1)}%`}
        />
        <MetricRow
          icon={<DollarSign className="w-3.5 h-3.5" />}
          label="Cost"
          value={`$${version.cost.toFixed(3)}`}
        />
        <MetricRow
          icon={<Users className="w-3.5 h-3.5" />}
          label="Agents"
          value={`${version.agentCount}`}
        />
      </div>
    </div>
  );
}

function MetricRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function DeltaCard({
  label,
  delta,
  v1Value,
  v2Value,
  format,
  isPositiveGood = true,
}: {
  label: string;
  delta: number;
  v1Value: number;
  v2Value: number;
  format: 'percent' | 'currency' | 'number';
  isPositiveGood?: boolean;
}) {
  const isImprovement = isPositiveGood ? delta > 0 : delta < 0;
  const color = isImprovement ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-gray-400';
  
  const formatValue = (val: number) => {
    if (format === 'percent') return `${(val * 100).toFixed(1)}%`;
    if (format === 'currency') return `$${val.toFixed(3)}`;
    return val.toString();
  };

  const formatDelta = (d: number) => {
    const prefix = d > 0 ? '+' : '';
    if (format === 'percent') return `${prefix}${(d * 100).toFixed(1)}%`;
    if (format === 'currency') return `${prefix}$${d.toFixed(3)}`;
    return `${prefix}${d}`;
  };

  return (
    <div className="bg-[#111116] border border-[#24242C] rounded-lg p-3">
      <div className="text-xs text-gray-500 mb-2">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-sm text-gray-600">{formatValue(v1Value)}</span>
        <ArrowRight className="w-3 h-3 text-gray-600" />
        <span className="text-lg font-semibold text-white">{formatValue(v2Value)}</span>
      </div>
      <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${color}`}>
        {delta > 0 ? (
          <TrendingUp className="w-3 h-3" />
        ) : delta < 0 ? (
          <TrendingDown className="w-3 h-3" />
        ) : null}
        <span>{formatDelta(delta)}</span>
      </div>
    </div>
  );
}

function DimensionalComparison({
  v1Dims,
  v2Dims,
}: {
  v1Dims: VersionMetrics['dimensions'];
  v2Dims: VersionMetrics['dimensions'];
}) {
  if (!v1Dims || !v2Dims) return null;

  const dimensions = [
    { key: 'correctness', label: 'Correctness' },
    { key: 'evidence', label: 'Evidence' },
    { key: 'completeness', label: 'Completeness' },
    { key: 'reasoning', label: 'Reasoning' },
    { key: 'requirementFit', label: 'Requirement Fit' },
    { key: 'consistency', label: 'Consistency' },
    { key: 'clarity', label: 'Clarity' },
    { key: 'uncertainty', label: 'Uncertainty' },
  ];

  return (
    <div className="bg-[#111116] border border-[#24242C] rounded-lg p-4">
      <div className="text-sm font-medium text-white mb-4">Dimensional Improvements</div>
      <div className="grid grid-cols-2 gap-4">
        {dimensions.map(({ key, label }) => {
          const v1 = v1Dims[key as keyof typeof v1Dims];
          const v2 = v2Dims[key as keyof typeof v2Dims];
          const delta = v2 - v1;
          const improved = delta > 0;

          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">{label}</span>
                <span className={`font-medium ${improved ? 'text-emerald-400' : 'text-gray-600'}`}>
                  {delta > 0 ? '+' : ''}{(delta * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#0B0B0F] rounded-full h-1.5">
                  <div
                    className="bg-gray-600 h-1.5 rounded-full"
                    style={{ width: `${v1 * 100}%` }}
                  />
                </div>
                <ArrowRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
                <div className="flex-1 bg-[#0B0B0F] rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${improved ? 'bg-emerald-500' : 'bg-gray-600'}`}
                    style={{ width: `${v2 * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EvolutionSummary({ versions }: { versions: VersionMetrics[] }) {
  const first = versions[0];
  const last = versions[versions.length - 1];
  
  const totalQualityGain = last.quality - first.quality;
  const totalCostChange = last.cost - first.cost;
  const totalIterations = versions.length;

  return (
    <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Evolution Summary</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">Total Quality Gain</div>
          <div className="text-2xl font-bold text-emerald-400">
            +{(totalQualityGain * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {(first.quality * 100).toFixed(1)}% → {(last.quality * 100).toFixed(1)}%
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1">Cost Efficiency</div>
          <div className={`text-2xl font-bold ${totalCostChange < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {totalCostChange < 0 ? '-' : '+'}${Math.abs(totalCostChange).toFixed(3)}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            ${first.cost.toFixed(3)} → ${last.cost.toFixed(3)}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1">Iterations</div>
          <div className="text-2xl font-bold text-violet-400">{totalIterations}</div>
          <div className="text-xs text-gray-600 mt-1">
            V1 → V{last.version}
          </div>
        </div>
      </div>
    </div>
  );
}
