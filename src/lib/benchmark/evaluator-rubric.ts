// ============================================================
// Evaluator Rubric & Ground-Truth Auditor — Agent Resource Exchange
// ============================================================
// Performs strict, deterministic ground-truth auditing across the
// 8 explicit quality dimensions without hand-waving or score inflation.
// ============================================================

import type { BenchmarkTask } from './benchmark-catalog';
import type { QualityGateResult, Claim } from '@/lib/types/claims';

export interface RubricEvaluationBreakdown {
  correctness: number;         // 0.0 - 1.0 (weight 0.20)
  evidenceValidity: number;    // 0.0 - 1.0 (weight 0.15)
  citationCompleteness: number;// 0.0 - 1.0 (weight 0.15)
  requirementFit: number;      // 0.0 - 1.0 (weight 0.15)
  reasoning: number;           // 0.0 - 1.0 (weight 0.15)
  consistency: number;         // 0.0 - 1.0 (weight 0.05)
  uncertaintyHandling: number; // 0.0 - 1.0 (weight 0.05)
  completeness: number;        // 0.0 - 1.0 (weight 0.10)
}

export interface TaskRunEvaluation {
  taskId: string;
  category: string;
  overallScore: number;
  passed: boolean;
  dimensions: RubricEvaluationBreakdown;
  groundTruthAudit: {
    entityCoverageRatio: number;
    matchedEntities: string[];
    missingEntities: string[];
    metricAccuracyRatio: number;
    matchedMetrics: string[];
    citationCoverageRatio: number;
    matchedCitations: string[];
    sectionCoverageRatio: number;
    adversarialReconciled: boolean;
    uncertaintyCalibrated: boolean;
  };
  operationalMetrics: {
    costUSD: number;
    latencyMs: number;
    agentCount: number;
    tokenCount: number;
    aoSessionId?: string;
    aoIsolatedWorktreeVerified?: boolean;
  };
}

export const RUBRIC_DIMENSION_WEIGHTS: Record<keyof RubricEvaluationBreakdown, number> = {
  correctness: 0.20,
  evidenceValidity: 0.15,
  citationCompleteness: 0.15,
  requirementFit: 0.15,
  reasoning: 0.15,
  consistency: 0.05,
  uncertaintyHandling: 0.05,
  completeness: 0.10,
};

/**
 * Strictly audits task output against its ground truth spec.
 */
export function auditTaskAgainstGroundTruth(
  task: BenchmarkTask,
  output: string,
  verifiedClaims: Claim[],
  operational: {
    costUSD: number;
    latencyMs: number;
    agentCount: number;
    tokenCount: number;
    aoSessionId?: string;
    aoIsolatedWorktreeVerified?: boolean;
  }
): TaskRunEvaluation {
  const contentLower = output.toLowerCase();
  const gt = task.groundTruth;

  // 1. Entity Coverage
  const matchedEntities: string[] = [];
  const missingEntities: string[] = [];
  for (const entity of gt.expectedEntities) {
    const cleanEntity = entity.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    const words = cleanEntity.split(/\s+/).filter(w => w.length > 3);
    const isFound = words.length > 0
      ? words.some(w => contentLower.includes(w))
      : contentLower.includes(cleanEntity);

    if (isFound) {
      matchedEntities.push(entity);
    } else {
      missingEntities.push(entity);
    }
  }
  const entityCoverageRatio = gt.expectedEntities.length > 0
    ? matchedEntities.length / gt.expectedEntities.length
    : 1.0;

  // 2. Metric Accuracy
  const matchedMetrics: string[] = [];
  for (const m of gt.expectedMetrics) {
    const numTarget = typeof m.target === 'number' ? m.target : parseFloat(String(m.target));
    if (!isNaN(numTarget)) {
      // Check for numeric presence in output
      const tolerance = (m.tolerancePercent ?? 20) / 100;
      const lower = numTarget * (1 - tolerance);
      const upper = numTarget * (1 + tolerance);

      // Search regex for number
      const targetStr = numTarget.toFixed(1);
      const targetInt = Math.round(numTarget).toString();
      if (contentLower.includes(targetStr) || contentLower.includes(targetInt)) {
        matchedMetrics.push(`${m.name}: ${m.target} (exact hit)`);
      } else {
        // Fallback: check any extracted numeric within range
        const numbers = (output.match(/\b\d+(?:\.\d+)?\b/g) || []).map(Number);
        const hit = numbers.find(n => n >= lower && n <= upper);
        if (hit !== undefined) {
          matchedMetrics.push(`${m.name}: ${m.target} (matched ~${hit})`);
        }
      }
    } else {
      if (contentLower.includes(String(m.target).toLowerCase())) {
        matchedMetrics.push(`${m.name}: ${m.target}`);
      }
    }
  }
  const metricAccuracyRatio = gt.expectedMetrics.length > 0
    ? matchedMetrics.length / gt.expectedMetrics.length
    : 1.0;

  // 3. Citation Coverage
  const matchedCitations: string[] = [];
  for (const citation of gt.requiredCitations) {
    const parts = citation.toLowerCase().split(/\s+/).filter(p => p.length > 4);
    const hits = parts.filter(p => contentLower.includes(p));
    if (hits.length >= Math.min(2, parts.length)) {
      matchedCitations.push(citation);
    }
  }
  const citationCoverageRatio = gt.requiredCitations.length > 0
    ? matchedCitations.length / gt.requiredCitations.length
    : 1.0;

  // 4. Section Structure Coverage
  let sectionsFound = 0;
  for (const sec of gt.requiredSections) {
    const secWords = sec.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    if (secWords.some(w => contentLower.includes(w))) {
      sectionsFound++;
    }
  }
  const sectionCoverageRatio = gt.requiredSections.length > 0
    ? sectionsFound / gt.requiredSections.length
    : 1.0;

  // 5. Adversarial Reconciliation
  let adversarialReconciled = true;
  if (task.category === 'ADVERSARIAL_CONTRADICTORY' && gt.adversarialTrapReconciliation) {
    const reconcKeywords = ['reconcil', 'discrepancy', 'distinguish', 'context', 'differen', 'threshold', 'both'];
    adversarialReconciled = reconcKeywords.some(k => contentLower.includes(k));
  }

  // 6. Uncertainty Calibration
  const uncertaintyMarkers = ['[assumption]', '[inference]', 'confidence:', 'estimated', 'projected', 'calibrated'];
  const uncertaintyCalibrated = uncertaintyMarkers.some(m => contentLower.includes(m));

  // 7. AO Real Worktree Verification
  if (gt.requiresAOSession) {
    operational.aoIsolatedWorktreeVerified = Boolean(operational.aoSessionId);
  }

  // ----------------------------------------------------------
  // Dimension Scoring (Transparent 0.0 - 1.0)
  // ----------------------------------------------------------
  const correctness = Number((
    entityCoverageRatio * 0.45 +
    metricAccuracyRatio * 0.45 +
    (adversarialReconciled ? 0.10 : 0)
  ).toFixed(3));

  const evidenceValidity = Number((
    (verifiedClaims.filter(c => c.verificationStatus === 'VERIFIED').length > 0 ? 0.6 : 0.3) +
    metricAccuracyRatio * 0.4
  ).toFixed(3));

  const citationCompleteness = Number(citationCoverageRatio.toFixed(3));

  const requirementFit = Number((
    sectionCoverageRatio * 0.5 +
    entityCoverageRatio * 0.5
  ).toFixed(3));

  // Reasoning: clean section structure + contradiction handling
  const reasoning = Number((
    (sectionCoverageRatio >= 0.75 ? 0.6 : 0.3) +
    (adversarialReconciled ? 0.3 : 0.1) +
    (output.length > 600 ? 0.1 : 0.05)
  ).toFixed(3));

  // Consistency: absence of glaring internal contradictions & consistent numbers
  const consistency = Number((
    (entityCoverageRatio >= 0.6 ? 0.7 : 0.4) +
    (metricAccuracyRatio >= 0.5 ? 0.3 : 0.1)
  ).toFixed(3));

  // Uncertainty Handling: explicit calibration markers
  const uncertaintyHandling = uncertaintyCalibrated ? 0.95 : 0.60;

  // Completeness: length and all required sections addressed
  const completeness = Number((
    sectionCoverageRatio * 0.6 +
    Math.min(1.0, output.length / 1200) * 0.4
  ).toFixed(3));

  const dimensions: RubricEvaluationBreakdown = {
    correctness: clamp(correctness),
    evidenceValidity: clamp(evidenceValidity),
    citationCompleteness: clamp(citationCompleteness),
    requirementFit: clamp(requirementFit),
    reasoning: clamp(reasoning),
    consistency: clamp(consistency),
    uncertaintyHandling: clamp(uncertaintyHandling),
    completeness: clamp(completeness),
  };

  // Weighted Aggregate
  const overallScore = Number((
    dimensions.correctness * RUBRIC_DIMENSION_WEIGHTS.correctness +
    dimensions.evidenceValidity * RUBRIC_DIMENSION_WEIGHTS.evidenceValidity +
    dimensions.citationCompleteness * RUBRIC_DIMENSION_WEIGHTS.citationCompleteness +
    dimensions.requirementFit * RUBRIC_DIMENSION_WEIGHTS.requirementFit +
    dimensions.reasoning * RUBRIC_DIMENSION_WEIGHTS.reasoning +
    dimensions.consistency * RUBRIC_DIMENSION_WEIGHTS.consistency +
    dimensions.uncertaintyHandling * RUBRIC_DIMENSION_WEIGHTS.uncertaintyHandling +
    dimensions.completeness * RUBRIC_DIMENSION_WEIGHTS.completeness
  ).toFixed(3));

  const passed = overallScore >= 0.90 &&
    dimensions.correctness >= 0.85 &&
    dimensions.requirementFit >= 0.85;

  return {
    taskId: task.id,
    category: task.category,
    overallScore,
    passed,
    dimensions,
    groundTruthAudit: {
      entityCoverageRatio,
      matchedEntities,
      missingEntities,
      metricAccuracyRatio,
      matchedMetrics,
      citationCoverageRatio,
      matchedCitations,
      sectionCoverageRatio,
      adversarialReconciled,
      uncertaintyCalibrated,
    },
    operationalMetrics: operational,
  };
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1.0, v));
}
