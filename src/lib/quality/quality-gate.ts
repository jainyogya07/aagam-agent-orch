// ============================================================
// Quality Gate & Defect Auditor — Agent Resource Exchange
// ============================================================
// Implements hard multi-dimensional quality gating:
// Correctness (25%), Evidence (20%), Completeness (15%), Reasoning (15%),
// Requirement Fit (10%), Consistency (5%), Clarity (5%), Uncertainty (5%).
// If overall < 95% or any critical claim is unverified, produces a
// structured Quality Defect Report to direct targeted resource repairs.
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { eventBus } from '@/lib/events/event-emitter';
import { withTrace } from '@/lib/observability/neatlogs';
import { ProviderGateway } from '@/lib/providers/gateway';
import type { Claim, RequirementCoverage, DefectItem, QualityGateResult } from '@/lib/types/claims';

export const QUALITY_WEIGHTS = {
  correctness: 0.25,
  evidence: 0.20,
  completeness: 0.15,
  reasoning: 0.15,
  requirementFit: 0.10,
  consistency: 0.05,
  clarity: 0.05,
  uncertainty: 0.05,
};

export async function evaluateQualityGate(
  finalAnswer: string,
  taskGoal: string,
  claims: Claim[],
  requirementCoverage: RequirementCoverage[],
  existingDefects: DefectItem[],
  gateway: ProviderGateway,
  runId: string
): Promise<QualityGateResult> {
  return withTrace(
    {
      name: 'quality-gate',
      kind: 'CHAIN',
      sessionId: runId,
      attributes: {
        run_id: runId,
        answer_length: finalAnswer.length,
        claims_count: claims.length,
      },
    },
    async () => {
      eventBus.log(runId, 'info', 'Quality Gate: Running strict 8-dimensional outcome audit against rubric...');

      const criticalClaims = claims.filter(c => c.importance === 'CRITICAL');
      const verifiedCriticalCount = criticalClaims.filter(c => c.verificationStatus === 'VERIFIED').length;
      const criticalClaimsVerifiedRatio = criticalClaims.length > 0 ? verifiedCriticalCount / criticalClaims.length : 1.0;

      const claimsWithEvidence = claims.filter(c => c.evidence.length > 0 || c.verificationStatus === 'VERIFIED');
      const evidenceCoverageRatio = claims.length > 0 ? claimsWithEvidence.length / claims.length : 1.0;

      const systemPrompt = `You are a strict, uncompromising Quality Gate Auditor for an institutional AI decision platform.
Evaluate the provided final answer across 8 independent dimensions.
Score each dimension honestly from 0.00 to 1.00 based STRICTLY on actual text content:

1. correctness (0.0-1.0, weight 25%): Factual precision, domain accuracy, sound principles.
2. evidence (0.0-1.0, weight 20%): Citations, empirical backing, verifiable metrics.
3. completeness (0.0-1.0, weight 15%): Comprehensive coverage of competitors, market sizing, risks, and next steps.
4. reasoning (0.0-1.0, weight 15%): Logical flow, non-circular arguments, justified conclusions.
5. requirementFit (0.0-1.0, weight 10%): Compliance with every stated user requirement.
6. consistency (0.0-1.0, weight 5%): No internal contradictions, consistent numbers.
7. clarity (0.0-1.0, weight 5%): Professional executive structuring, clean tables, readable synthesis.
8. uncertainty (0.0-1.0, weight 5%): Well-calibrated confidence, explicit flagging of assumptions.

Return JSON:
{
  "dimensions": {
    "correctness": 0.95,
    "evidence": 0.95,
    "completeness": 0.95,
    "reasoning": 0.95,
    "requirementFit": 0.95,
    "consistency": 0.95,
    "clarity": 0.95,
    "uncertainty": 0.95
  },
  "defects": [
    {
      "severity": "CRITICAL" | "MAJOR" | "MINOR",
      "dimension": "...",
      "description": "...",
      "recommendedAction": "...",
      "targetSpecialistRole": "...",
      "expectedQualityGain": 0.15,
      "estimatedResourceCost": 0.04
    }
  ],
  "recommendations": ["..."]
}`;

      const userPrompt = `## Task Goal
${taskGoal}

## Requirement Coverage Matrix
${JSON.stringify(requirementCoverage, null, 2)}

## Verified Claims (${claims.length} total, ${criticalClaims.length} critical, ${(criticalClaimsVerifiedRatio * 100).toFixed(0)}% verified)
${JSON.stringify(claims.map(c => ({ claim: c.claim, status: c.verificationStatus, confidence: c.confidence })), null, 2)}

## Final Synthesized Answer to Audit
${finalAnswer}

Audit the final answer against the rubric and return JSON:`;

      try {
        const availableModels = gateway.getAvailableModels();
        const modelToUse = availableModels.includes('glm-4-flash')
          ? 'glm-4-flash'
          : availableModels.includes('gpt-5-nano')
          ? 'gpt-5-nano'
          : (availableModels[0] || 'glm-4-flash');

        const response = await gateway.generate(modelToUse, userPrompt, {
          systemPrompt,
          temperature: 0.15,
          maxTokens: 1500,
          responseFormat: 'json',
        });

        const parsed = JSON.parse(response.content);
        const d = parsed.dimensions || {};

        const dimensions = {
          correctness: clampScore(d.correctness, 0.50),
          evidence: clampScore(d.evidence, 0.45),
          completeness: clampScore(d.completeness, 0.50),
          reasoning: clampScore(d.reasoning, 0.50),
          requirementFit: clampScore(d.requirementFit, 0.55),
          consistency: clampScore(d.consistency, 0.60),
          clarity: clampScore(d.clarity, 0.60),
          uncertainty: clampScore(d.uncertainty, 0.45),
        };

        // Calculate genuine weighted score
        const overallScore = Number((
          dimensions.correctness * QUALITY_WEIGHTS.correctness +
          dimensions.evidence * QUALITY_WEIGHTS.evidence +
          dimensions.completeness * QUALITY_WEIGHTS.completeness +
          dimensions.reasoning * QUALITY_WEIGHTS.reasoning +
          dimensions.requirementFit * QUALITY_WEIGHTS.requirementFit +
          dimensions.consistency * QUALITY_WEIGHTS.consistency +
          dimensions.clarity * QUALITY_WEIGHTS.clarity +
          dimensions.uncertainty * QUALITY_WEIGHTS.uncertainty
        ).toFixed(3));

        // Find weakest dimension
        let weakestDimension = 'evidence';
        let lowestVal = 1.0;
        for (const [dim, val] of Object.entries(dimensions)) {
          if (val < lowestVal) {
            lowestVal = val;
            weakestDimension = dim;
          }
        }

        const defects: DefectItem[] = Array.isArray(parsed.defects)
          ? parsed.defects.map((def: Record<string, unknown>) => ({
              id: uuidv4(),
              severity: def.severity === 'CRITICAL' ? 'CRITICAL' : def.severity === 'MAJOR' ? 'MAJOR' : 'MINOR',
              dimension: String(def.dimension || weakestDimension),
              description: String(def.description || 'Quality gap identified in output'),
              affectedClaimIds: Array.isArray(def.affectedClaimIds) ? def.affectedClaimIds as string[] : [],
              recommendedAction: String(def.recommendedAction || 'Execute targeted repair agent'),
              targetSpecialistRole: String(def.targetSpecialistRole || 'Evidence Verifier'),
              expectedQualityGain: typeof def.expectedQualityGain === 'number' ? def.expectedQualityGain : 0.08,
              estimatedResourceCost: typeof def.estimatedResourceCost === 'number' ? def.estimatedResourceCost : 0.03,
            }))
          : existingDefects;

        // Strict pass check: overall >= 0.95 and critical claims verified >= 0.95
        const passed = overallScore >= 0.95 &&
          criticalClaimsVerifiedRatio >= 0.95 &&
          evidenceCoverageRatio >= 0.90 &&
          requirementCoverage.every(r => r.covered);

        const result: QualityGateResult = {
          passed,
          overallScore,
          dimensions,
          criticalClaimsVerifiedRatio,
          evidenceCoverageRatio,
          defects,
          weakestDimension,
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        };

        eventBus.emit({
          id: uuidv4(),
          runId,
          type: 'quality.gate.evaluated',
          timestamp: Date.now(),
          payload: {
            passed: result.passed,
            overallScore: result.overallScore,
            dimensions: result.dimensions,
            weakestDimension: result.weakestDimension,
            defectCount: result.defects.length,
          },
        });

        eventBus.log(
          runId,
          result.passed ? 'info' : 'warn',
          `Quality Gate Result: ${result.passed ? 'PASSED' : 'DEFECTS DETECTED'} — Overall Quality: ${(result.overallScore * 100).toFixed(1)}% (Weakest: ${result.weakestDimension}: ${(dimensions[result.weakestDimension as keyof typeof dimensions] * 100).toFixed(0)}%)`
        );

        return result;

      } catch (err) {
        eventBus.log(runId, 'warn', `Quality gate fallback engaged: ${err instanceof Error ? err.message : String(err)}`);

        // Strict deterministic rubric fallback — conservative, honest scoring
        const hasTAM = /tam|market size|\$\d+/i.test(finalAnswer);
        const hasCompetitors = /competitor|incumbent/i.test(finalAnswer);
        const hasRisks = /risk|mitigat/i.test(finalAnswer);
        const hasRec = /recommendation|verdict/i.test(finalAnswer);
        const hasEvidence = /source|study|report|research|gartner|mckinsey/i.test(finalAnswer);
        const hasNumbers = /\d+\.\d+|\$\d+|\d+%/i.test(finalAnswer);
        const hasStructure = /##|\n-\s|\n\d+\./i.test(finalAnswer);
        const hasUncertainty = /assumption|inference|estimated|projected|confidence/i.test(finalAnswer);

        // Each signal contributes independently — no magical 0.95 defaults
        const correctnessScore = (hasTAM ? 0.25 : 0) + (hasCompetitors ? 0.20 : 0) + (hasNumbers ? 0.20 : 0) + (hasRisks ? 0.15 : 0) + 0.10;
        const evidenceScore = (hasEvidence ? 0.35 : 0.05) + (hasNumbers ? 0.25 : 0) + (criticalClaimsVerifiedRatio * 0.30) + 0.05;
        const completenessScore = (hasTAM ? 0.25 : 0) + (hasCompetitors ? 0.25 : 0) + (hasRisks ? 0.25 : 0) + (hasRec ? 0.25 : 0);
        const reasoningScore = (hasStructure ? 0.30 : 0.10) + (hasRisks ? 0.25 : 0.05) + (hasRec ? 0.25 : 0.05) + 0.10;
        const requirementFitScore = completenessScore;
        const consistencyScore = hasNumbers ? 0.65 : 0.45;
        const clarityScore = hasStructure ? 0.70 : 0.40;
        const uncertaintyScore = hasUncertainty ? 0.70 : 0.35;

        const dimensions = {
          correctness: Math.min(1, correctnessScore),
          evidence: Math.min(1, evidenceScore),
          completeness: completenessScore,
          reasoning: Math.min(1, reasoningScore),
          requirementFit: requirementFitScore,
          consistency: consistencyScore,
          clarity: clarityScore,
          uncertainty: uncertaintyScore,
        };

        const overallScore = Number((
          dimensions.correctness * QUALITY_WEIGHTS.correctness +
          dimensions.evidence * QUALITY_WEIGHTS.evidence +
          dimensions.completeness * QUALITY_WEIGHTS.completeness +
          dimensions.reasoning * QUALITY_WEIGHTS.reasoning +
          dimensions.requirementFit * QUALITY_WEIGHTS.requirementFit +
          dimensions.consistency * QUALITY_WEIGHTS.consistency +
          dimensions.clarity * QUALITY_WEIGHTS.clarity +
          dimensions.uncertainty * QUALITY_WEIGHTS.uncertainty
        ).toFixed(3));

        return {
          passed: overallScore >= 0.95 && criticalClaimsVerifiedRatio >= 0.95,
          overallScore,
          dimensions,
          criticalClaimsVerifiedRatio,
          evidenceCoverageRatio,
          defects: existingDefects,
          weakestDimension: 'completeness',
          recommendations: ['Ensure all market and competitor requirements are fully detailed.'],
        };
      }
    }
  );
}

function clampScore(val: unknown, fallback: number): number {
  const n = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}
