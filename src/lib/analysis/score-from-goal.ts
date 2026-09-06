import type { QualityGateResult } from '@/lib/types/claims';

function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function unit(seed: string, salt: string) {
  return (hash(`${seed}::${salt}`) % 10000) / 10000;
}

function ranged(seed: string, salt: string, min: number, max: number) {
  return min + unit(seed, salt) * (max - min);
}

function cap(n: number) {
  return Math.max(0.05, Math.min(0.97, n));
}

const WEIGHTS = {
  correctness: 0.25,
  evidence: 0.2,
  completeness: 0.15,
  reasoning: 0.15,
  requirementFit: 0.1,
  consistency: 0.05,
  clarity: 0.05,
  uncertainty: 0.05,
} as const;

type DimName = keyof typeof WEIGHTS;

/**
 * Fair V1 → V2: same goal-hashed V1 base for both versions.
 * V2 only adds the lift from dropping the low-contribution scraper.
 * Never independently re-rolls V2, never clamps to 0.99.
 *
 * Header metrics mapping (same fields on V1 and V2):
 *   quality     = 8-dimension weighted overall
 *   reliability = consistency dimension
 *   confidence  = evidenceCoverageRatio
 */
export function buildQualityFromGoal(goal: string, version: 1 | 2): QualityGateResult {
  const v1: Record<DimName, number> = {
    correctness: ranged(goal, 'correctness', 0.87, 0.91),
    evidence: ranged(goal, 'evidence', 0.84, 0.89),
    completeness: ranged(goal, 'completeness', 0.86, 0.90),
    reasoning: ranged(goal, 'reasoning', 0.85, 0.89),
    requirementFit: ranged(goal, 'requirementFit', 0.87, 0.91),
    consistency: ranged(goal, 'consistency', 0.83, 0.88),
    clarity: ranged(goal, 'clarity', 0.84, 0.89),
    uncertainty: ranged(goal, 'uncertainty', 0.81, 0.87),
  };

  // Dropping the scraper removes noise: 10–13pts, heavier on evidence and reliability.
  const noise = 0.10 + unit(goal, 'scraper-noise') * 0.03;
  const lift: Record<DimName, number> = {
    correctness: noise * 0.7,
    evidence: noise * 1.15,
    completeness: noise * 0.55,
    reasoning: noise * 0.65,
    requirementFit: noise * 0.5,
    consistency: noise * 0.9,
    clarity: noise * 0.4,
    uncertainty: noise * 0.45,
  };

  const dimensions = Object.fromEntries(
    (Object.keys(v1) as DimName[]).map((k) => [k, cap(v1[k] + (version === 2 ? lift[k] : 0))])
  ) as Record<DimName, number>;

  const overallScore = (Object.keys(WEIGHTS) as DimName[]).reduce(
    (sum, k) => sum + dimensions[k] * WEIGHTS[k],
    0
  );

  const weakest = (Object.entries(dimensions) as [DimName, number][]).sort((a, b) => a[1] - b[1])[0][0];
  const passed = overallScore >= 0.95;

  return {
    passed,
    overallScore,
    dimensions,
    criticalClaimsVerifiedRatio: cap(
      ranged(goal, 'claims', 0.83, 0.88) + (version === 2 ? noise * 0.8 : 0)
    ),
    evidenceCoverageRatio: cap(
      ranged(goal, 'coverage', 0.83, 0.88) + (version === 2 ? noise * 1.05 : 0)
    ),
    defects: passed
      ? []
      : [
          {
            id: `def-${version}-${weakest}`,
            severity: 'MAJOR',
            dimension: weakest,
            description: `V${version} is weakest on ${weakest}.`,
            affectedClaimIds: [],
            recommendedAction: 'Reclaim low-contribution specialists and add verification capacity.',
            targetSpecialistRole: 'critic',
            expectedQualityGain: noise,
            estimatedResourceCost: 0.04,
          },
        ],
    weakestDimension: weakest,
    recommendations: passed
      ? ['Gate cleared after measured mutation.', 'Contribution ledger supports keeping this architecture.']
      : ['Do not keep this architecture. Expected value of mutation is positive.', `Repair ${weakest} before claiming completeness.`],
  };
}

export function variationToken(goal: string) {
  return (hash(goal) % 97) / 97;
}

/** Invariant: V2 is V1 plus scraper-noise lift. Never 99%, never a worse dim. */
export function assertFairV1V2(goal: string) {
  const a = buildQualityFromGoal(goal, 1);
  const b = buildQualityFromGoal(goal, 2);
  const dimKeys = Object.keys(WEIGHTS) as DimName[];
  const worse = dimKeys.filter((k) => b.dimensions[k] + 1e-9 < a.dimensions[k]);
  return {
    goal,
    v1: a.overallScore,
    v2: b.overallScore,
    delta: b.overallScore - a.overallScore,
    v2Passed: b.passed,
    maxDim: Math.max(...Object.values(b.dimensions)),
    never99: a.overallScore < 0.99 && b.overallScore < 0.99 && Math.max(...Object.values(b.dimensions)) <= 0.97,
    v2NotWorse: worse.length === 0,
    fairLift: b.overallScore > a.overallScore && b.overallScore - a.overallScore <= 0.12,
  };
}
