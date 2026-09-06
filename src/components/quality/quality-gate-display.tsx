'use client';

// ============================================================
// Quality Gate Display Component
// ============================================================
// Visualizes the 8-dimensional quality audit, defect map,
// and repair decisions. Shows V1 → V2 quality improvements.
// ============================================================

import { AlertTriangle, Check, X, TrendingUp, Zap } from 'lucide-react';
import type { QualityGateResult } from '@/lib/types/claims';
import type { RepairPlan } from '@/lib/quality/quality-repair-engine';

interface QualityGateDisplayProps {
  result: QualityGateResult;
  repairPlan?: RepairPlan;
  threshold?: number;
  showRepairDetails?: boolean;
}

export function QualityGateDisplay({
  result,
  repairPlan,
  threshold = 0.95,
  showRepairDetails = false,
}: QualityGateDisplayProps) {
  const passed = result.overallScore >= threshold;
  const gap = threshold - result.overallScore;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {passed ? (
            <Check className="w-6 h-6 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          )}
          <div>
            <h2 className="text-lg font-semibold text-white">Quality Gate</h2>
            <p className="text-sm text-gray-400">
              {passed ? 'Threshold met' : 'Defects detected'}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-bold text-white">
            {(result.overallScore * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">
            Target: {(threshold * 100)}%
          </div>
        </div>
      </div>

      {/* Overall Status */}
      <div className={`relative overflow-hidden rounded-lg border ${
        passed
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-amber-500/5 border-amber-500/20'
      }`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Overall Quality</span>
            {!passed && (
              <span className="text-xs text-amber-400">
                Gap: {(gap * 100).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="w-full bg-[#0B0B0F] rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                passed ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${result.overallScore * 100}%` }}
            />
          </div>
          {!passed && (
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              <span>Repair required to meet threshold</span>
            </div>
          )}
        </div>
      </div>

      {/* 8-Dimensional Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
          Dimensional Analysis
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <DimensionCard
            name="Correctness"
            score={result.dimensions.correctness}
            weight={0.25}
            threshold={0.95}
          />
          <DimensionCard
            name="Evidence"
            score={result.dimensions.evidence}
            weight={0.20}
            threshold={0.95}
          />
          <DimensionCard
            name="Completeness"
            score={result.dimensions.completeness}
            weight={0.15}
            threshold={0.95}
          />
          <DimensionCard
            name="Reasoning"
            score={result.dimensions.reasoning}
            weight={0.15}
            threshold={0.95}
          />
          <DimensionCard
            name="Requirement Fit"
            score={result.dimensions.requirementFit}
            weight={0.10}
            threshold={0.95}
          />
          <DimensionCard
            name="Consistency"
            score={result.dimensions.consistency}
            weight={0.05}
            threshold={0.95}
          />
          <DimensionCard
            name="Clarity"
            score={result.dimensions.clarity}
            weight={0.05}
            threshold={0.95}
          />
          <DimensionCard
            name="Uncertainty"
            score={result.dimensions.uncertainty}
            weight={0.05}
            threshold={0.95}
          />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-[#111116] border border-[#24242C] rounded-lg">
        <MetricItem
          label="Critical Claims Verified"
          value={`${(result.criticalClaimsVerifiedRatio * 100).toFixed(0)}%`}
          target={95}
          current={result.criticalClaimsVerifiedRatio * 100}
        />
        <MetricItem
          label="Evidence Coverage"
          value={`${(result.evidenceCoverageRatio * 100).toFixed(0)}%`}
          target={90}
          current={result.evidenceCoverageRatio * 100}
        />
      </div>

      {/* Defects */}
      {result.defects.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Detected Defects ({result.defects.length})
          </h3>
          <div className="space-y-2">
            {result.defects.map((defect) => (
              <DefectCard key={defect.id} defect={defect} />
            ))}
          </div>
        </div>
      )}

      {/* Repair Plan */}
      {showRepairDetails && repairPlan && (
        <RepairPlanDisplay plan={repairPlan} />
      )}
    </div>
  );
}

// Supporting Components

function DimensionCard({
  name,
  score,
  weight,
  threshold,
}: {
  name: string;
  score: number;
  weight: number;
  threshold: number;
}) {
  const passed = score >= threshold;
  const gap = threshold - score;

  return (
    <div className="bg-[#111116] border border-[#24242C] rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300">{name}</span>
          <span className="text-xs text-gray-600">({(weight * 100).toFixed(0)}%)</span>
        </div>
        {passed ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : (
          <X className="w-4 h-4 text-amber-400" />
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">
        {(score * 100).toFixed(0)}%
      </div>
      {!passed && (
        <div className="text-xs text-amber-400">
          Gap: {(gap * 100).toFixed(1)}%
        </div>
      )}
    </div>
  );
}

function MetricItem({
  label,
  value,
  target,
  current,
}: {
  label: string;
  value: string;
  target: number;
  current: number;
}) {
  const passed = current >= target;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        {passed ? (
          <Check className="w-3 h-3 text-emerald-400" />
        ) : (
          <X className="w-3 h-3 text-amber-400" />
        )}
      </div>
      <div className="text-lg font-semibold text-white">{value}</div>
      <div className="text-xs text-gray-600">Target: {target}%</div>
    </div>
  );
}

function DefectCard({ defect }: { defect: any }) {
  const severityColors = {
    CRITICAL: 'border-red-500/30 bg-red-500/5',
    MAJOR: 'border-amber-500/30 bg-amber-500/5',
    MINOR: 'border-gray-500/30 bg-gray-500/5',
  };

  const severityIcons = {
    CRITICAL: '🔴',
    MAJOR: '🟡',
    MINOR: '⚪',
  };

  return (
    <div className={`border rounded-lg p-3 ${severityColors[defect.severity as keyof typeof severityColors]}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{severityIcons[defect.severity as keyof typeof severityIcons]}</span>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white capitalize">
              {defect.dimension}
            </span>
            <span className="text-xs text-gray-500">{defect.severity}</span>
          </div>
          <p className="text-sm text-gray-400">{defect.description}</p>
          {defect.recommendedAction && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">→</span> {defect.recommendedAction}
            </div>
          )}
          {defect.expectedQualityGain && (
            <div className="flex items-center gap-4 text-xs">
              <span className="text-emerald-400">
                +{(defect.expectedQualityGain * 100).toFixed(1)}% expected gain
              </span>
              {defect.estimatedResourceCost && (
                <span className="text-gray-500">
                  ${defect.estimatedResourceCost.toFixed(3)} cost
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RepairPlanDisplay({ plan }: { plan: RepairPlan }) {
  return (
    <div className="space-y-4 p-4 bg-[#111116] border border-violet-500/20 rounded-lg">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Repair Plan</h3>
        {plan.approved ? (
          <span className="ml-auto text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Approved
          </span>
        ) : (
          <span className="ml-auto text-xs px-2 py-1 rounded bg-gray-500/10 text-gray-400 border border-gray-500/20">
            Rejected
          </span>
        )}
      </div>

      <p className="text-sm text-gray-400">{plan.reason}</p>

      {/* Resource Reclamation */}
      {plan.reclaimDecisions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Resource Reclamation
          </h4>
          <div className="space-y-1">
            {plan.reclaimDecisions.map((decision, i) => (
              <div key={i} className="text-xs text-gray-400 flex items-center justify-between">
                <span>{decision.agentName}</span>
                <span className="text-emerald-400">
                  +${decision.resourcesReclaimed.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
          <div className="text-sm font-medium text-white pt-2 border-t border-[#24242C]">
            Total Reclaimed: ${plan.totalReclaimed.toFixed(3)}
          </div>
        </div>
      )}

      {/* Selected Mutation */}
      {plan.selectedMutation && (
        <div className="space-y-2 p-3 bg-[#0B0B0F] rounded-lg">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Selected Mutation
            </h4>
            <span className="text-xs text-violet-400">{plan.selectedMutation.type}</span>
          </div>
          <p className="text-sm text-gray-300">{plan.selectedMutation.reason}</p>
          <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
            <div>
              <div className="text-gray-500">Quality Gain</div>
              <div className="text-emerald-400 font-medium">
                +{(plan.selectedMutation.expectedQualityGain * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-gray-500">Cost</div>
              <div className="text-white font-medium">
                ${plan.selectedMutation.estimatedCost.toFixed(3)}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Expected Value</div>
              <div className="text-violet-400 font-medium">
                {plan.selectedMutation.expectedValue.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version Transition */}
      <div className="flex items-center justify-center gap-3 pt-2 text-sm">
        <span className="text-gray-400">V{plan.sourceArchitectureVersion}</span>
        <TrendingUp className="w-4 h-4 text-violet-400" />
        <span className="text-white font-medium">V{plan.targetArchitectureVersion}</span>
      </div>
    </div>
  );
}
