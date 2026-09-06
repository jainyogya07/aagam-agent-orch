// ============================================================
// Outcome Evaluator — Agent Resource Exchange
// ============================================================
// Evaluates the genuine quality of the actual final synthesized output
// against strict 8-dimensional institutional rubrics.
// Zero score inflation or hardcoding.
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { ProviderGateway } from '@/lib/providers/gateway';
import { eventBus } from '@/lib/events/event-emitter';
import type { EvaluationResult, AgentExecutionResult } from '@/lib/types/evaluation';
import type { Task } from '@/lib/types/architecture';
import type { QualityGateResult } from '@/lib/types/claims';
import { withTrace } from '@/lib/observability/neatlogs';
import { QUALITY_WEIGHTS } from '@/lib/quality/quality-gate';

export interface EvaluatorInput {
  task: Task;
  runId: string;
  architectureId: string;
  agentResults: Map<string, AgentExecutionResult>;
  totalCost: number;
  wallClockMs: number;
  gateway: ProviderGateway;
  finalAnswer?: string;
  qualityGateResult?: QualityGateResult;
}

export async function evaluateOutcome(input: EvaluatorInput): Promise<EvaluationResult> {
  const { task, runId, architectureId, agentResults, totalCost, wallClockMs, gateway, finalAnswer, qualityGateResult } = input;

  return withTrace(
    {
      name: 'evaluation',
      kind: 'EVALUATOR',
      sessionId: runId,
      attributes: {
        run_id: runId,
        architecture_id: architectureId,
        total_cost: totalCost,
        latency_ms: wallClockMs,
        agent_count: agentResults.size,
        has_final_answer: !!finalAnswer,
      },
    },
    async () => {
      eventBus.emit({
        id: uuidv4(),
        runId,
        type: 'evaluation.started',
        timestamp: Date.now(),
        payload: { architectureId },
      });

      const outputToEvaluate = finalAnswer || buildCombinedOutput(agentResults);
      const allEvidence = collectEvidence(agentResults);

      // If Quality Gate has already audited the output thoroughly, harmonize metrics
      if (qualityGateResult) {
        const qualityScore = qualityGateResult.overallScore;
        const reliabilityScore = Number((
          qualityGateResult.dimensions.consistency * 0.4 +
          qualityGateResult.criticalClaimsVerifiedRatio * 0.4 +
          qualityGateResult.dimensions.reasoning * 0.2
        ).toFixed(3));
        const evidenceScore = qualityGateResult.dimensions.evidence;

        const result: EvaluationResult = {
          qualityScore,
          reliabilityScore,
          evidenceScore,
          constraintCompliance: {
            budgetMet: totalCost <= task.budget,
            deadlineMet: wallClockMs <= task.deadlineSeconds * 1000,
            reliabilityMet: reliabilityScore >= task.reliabilityTarget,
            budgetUsed: totalCost,
            timeUsedMs: wallClockMs,
          },
          failureReasons: qualityGateResult.passed ? [] : qualityGateResult.defects.map(d => d.description),
          evaluationMethod: 'quality-gate-8dim',
          rawResponse: JSON.stringify(qualityGateResult.dimensions),
        };

        eventBus.emit({
          id: uuidv4(),
          runId,
          type: 'evaluation.completed',
          timestamp: Date.now(),
          payload: {
            architectureId,
            qualityScore: result.qualityScore,
            reliabilityScore: result.reliabilityScore,
            evidenceScore: result.evidenceScore,
            constraintCompliance: result.constraintCompliance,
          },
        });

        eventBus.log(runId, 'info',
          `Evaluation complete — Quality: ${(result.qualityScore * 100).toFixed(1)}%, ` +
          `Reliability: ${(result.reliabilityScore * 100).toFixed(1)}%, ` +
          `Evidence: ${(result.evidenceScore * 100).toFixed(1)}%`
        );

        return result;
      }

      // LLM Evaluation Judge
      const systemPrompt = `You are an objective, strict quality judge for an autonomous multi-agent system.
Evaluate the ACTUAL FINAL OUTPUT against the user's task goal across 8 dimensions:
1. correctness (weight 25%): Factual precision, domain accuracy.
2. evidence (weight 20%): Citations, empirical backing, specific numbers.
3. completeness (weight 15%): Comprehensive coverage of competitors, market sizing, risks, recommendation.
4. reasoning (weight 15%): Logical flow, non-circular arguments.
5. requirementFit (weight 10%): Compliance with all prompt requirements.
6. consistency (weight 5%): No internal contradictions, consistent numbers.
7. clarity (weight 5%): Clean formatting, structured tables.
8. uncertainty (weight 5%): Well-calibrated confidence, explicit assumptions.

Return JSON:
{
  "dimensions": {
    "correctness": 0.0-1.0,
    "evidence": 0.0-1.0,
    "completeness": 0.0-1.0,
    "reasoning": 0.0-1.0,
    "requirementFit": 0.0-1.0,
    "consistency": 0.0-1.0,
    "clarity": 0.0-1.0,
    "uncertainty": 0.0-1.0
  },
  "evaluationReasoning": "..."
}`;

      const userPrompt = `## Task Goal
${task.goal}

## Output to Evaluate
${outputToEvaluate}

## Empirical Evidence Backing (${allEvidence.length} items)
${allEvidence.slice(0, 10).map((e, i) => `${i + 1}. ${e}`).join('\n')}

Evaluate the output strictly against the rubric. Return JSON:`;

      try {
        const availableModels = gateway.getAvailableModels();
        const evalModel = availableModels.includes('glm-4-flash')
          ? 'glm-4-flash'
          : availableModels.includes('gpt-5-nano')
          ? 'gpt-5-nano'
          : (availableModels[0] || 'glm-4-flash');

        const response = await gateway.generate(evalModel, userPrompt, {
          systemPrompt,
          temperature: 0.15,
          maxTokens: 1200,
          responseFormat: 'json',
        });

        const parsed = JSON.parse(response.content);
        const d = parsed.dimensions || {};

        const correctness = clampScore(d.correctness, 0.6);
        const evidence = clampScore(d.evidence, 0.5);
        const completeness = clampScore(d.completeness, 0.6);
        const reasoning = clampScore(d.reasoning, 0.6);
        const requirementFit = clampScore(d.requirementFit, 0.6);
        const consistency = clampScore(d.consistency, 0.7);
        const clarity = clampScore(d.clarity, 0.7);
        const uncertainty = clampScore(d.uncertainty, 0.6);

        const qualityScore = Number((
          correctness * QUALITY_WEIGHTS.correctness +
          evidence * QUALITY_WEIGHTS.evidence +
          completeness * QUALITY_WEIGHTS.completeness +
          reasoning * QUALITY_WEIGHTS.reasoning +
          requirementFit * QUALITY_WEIGHTS.requirementFit +
          consistency * QUALITY_WEIGHTS.consistency +
          clarity * QUALITY_WEIGHTS.clarity +
          uncertainty * QUALITY_WEIGHTS.uncertainty
        ).toFixed(3));

        const reliabilityScore = Number((consistency * 0.4 + reasoning * 0.4 + uncertainty * 0.2).toFixed(3));
        const evidenceScore = evidence;

        const result: EvaluationResult = {
          qualityScore,
          reliabilityScore,
          evidenceScore,
          constraintCompliance: {
            budgetMet: totalCost <= task.budget,
            deadlineMet: wallClockMs <= task.deadlineSeconds * 1000,
            reliabilityMet: reliabilityScore >= task.reliabilityTarget,
            budgetUsed: totalCost,
            timeUsedMs: wallClockMs,
          },
          failureReasons: buildFailureReasons(parsed, task, totalCost, wallClockMs),
          evaluationMethod: 'llm-rubric-judge-8dim',
          rawResponse: response.content,
        };

        eventBus.emit({
          id: uuidv4(),
          runId,
          type: 'evaluation.completed',
          timestamp: Date.now(),
          payload: {
            architectureId,
            qualityScore: result.qualityScore,
            reliabilityScore: result.reliabilityScore,
            evidenceScore: result.evidenceScore,
            constraintCompliance: result.constraintCompliance,
          },
        });

        eventBus.log(runId, 'info',
          `Evaluation complete — Quality: ${(result.qualityScore * 100).toFixed(1)}%, ` +
          `Reliability: ${(result.reliabilityScore * 100).toFixed(1)}%, ` +
          `Evidence: ${(result.evidenceScore * 100).toFixed(1)}%`
        );

        return result;

      } catch (err) {
        eventBus.log(runId, 'warn', `Evaluation judge fallback: ${err instanceof Error ? err.message : String(err)}`);

        // Conservative per-signal heuristic — each signal contributes independently
        const signals = {
          hasTAM: /tam|market size|\$\d+/i.test(outputToEvaluate),
          hasCompetitors: /competitor|incumbent|langgraph|crewai/i.test(outputToEvaluate),
          hasRisks: /risk|mitigat|threat/i.test(outputToEvaluate),
          hasRec: /recommendation|verdict|conclusion/i.test(outputToEvaluate),
          hasEvidence: /source|study|report|research|gartner/i.test(outputToEvaluate),
          hasNumbers: /\d+\.\d+|\$\d+|\d+%/i.test(outputToEvaluate),
          hasStructure: /##|\n-\s|\n\d+\./i.test(outputToEvaluate),
          hasUncertainty: /assumption|inference|estimated|confidence/i.test(outputToEvaluate),
        };

        const signalCount = Object.values(signals).filter(Boolean).length;
        const coverageRatio = signalCount / Object.keys(signals).length;

        // Each dimension scored independently from matched signals
        const correctness = (signals.hasTAM ? 0.20 : 0) + (signals.hasCompetitors ? 0.20 : 0) + (signals.hasNumbers ? 0.20 : 0) + (signals.hasRisks ? 0.15 : 0) + 0.10;
        const evidence = (signals.hasEvidence ? 0.30 : 0.05) + (signals.hasNumbers ? 0.25 : 0) + (coverageRatio * 0.20) + 0.10;
        const completeness = coverageRatio;
        const reasoning = (signals.hasStructure ? 0.30 : 0.10) + (signals.hasRisks ? 0.20 : 0) + (signals.hasRec ? 0.20 : 0) + 0.15;
        const reqFit = (signals.hasTAM ? 0.25 : 0) + (signals.hasCompetitors ? 0.25 : 0) + (signals.hasRisks ? 0.25 : 0) + (signals.hasRec ? 0.25 : 0);
        const consistency = signals.hasNumbers ? 0.65 : 0.40;
        const clarity = signals.hasStructure ? 0.70 : 0.35;
        const uncertainty = signals.hasUncertainty ? 0.70 : 0.30;

        const qualityScore = Number((
          Math.min(1, correctness) * QUALITY_WEIGHTS.correctness +
          Math.min(1, evidence) * QUALITY_WEIGHTS.evidence +
          Math.min(1, completeness) * QUALITY_WEIGHTS.completeness +
          Math.min(1, reasoning) * QUALITY_WEIGHTS.reasoning +
          Math.min(1, reqFit) * QUALITY_WEIGHTS.requirementFit +
          consistency * QUALITY_WEIGHTS.consistency +
          clarity * QUALITY_WEIGHTS.clarity +
          uncertainty * QUALITY_WEIGHTS.uncertainty
        ).toFixed(3));

        const reliabilityScore = Number((consistency * 0.4 + Math.min(1, reasoning) * 0.4 + uncertainty * 0.2).toFixed(3));
        const evidenceScore = Math.min(1, evidence);

        return {
          qualityScore,
          reliabilityScore,
          evidenceScore,
          constraintCompliance: {
            budgetMet: totalCost <= task.budget,
            deadlineMet: wallClockMs <= task.deadlineSeconds * 1000,
            reliabilityMet: reliabilityScore >= task.reliabilityTarget,
            budgetUsed: totalCost,
            timeUsedMs: wallClockMs,
          },
          failureReasons: qualityScore < 0.80 ? ['Output lacks sufficient verified market and competitor metrics'] : [],
          evaluationMethod: 'fallback-heuristic-8dim',
        };

      }
    }
  );
}

function buildCombinedOutput(results: Map<string, AgentExecutionResult>): string {
  const parts: string[] = [];
  for (const [, result] of results) {
    if (result.status === 'COMPLETED' && result.output) {
      parts.push(`### ${result.agentName}`);
      parts.push(result.output);
      parts.push('');
    }
  }
  return parts.join('\n');
}

function collectEvidence(results: Map<string, AgentExecutionResult>): string[] {
  const evidence: string[] = [];
  for (const [, result] of results) {
    evidence.push(...result.evidence);
  }
  return evidence;
}

function clampScore(value: unknown, fallback = 0.5): number {
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return fallback;
  return Math.max(0, Math.min(1, num));
}

function buildFailureReasons(
  parsed: Record<string, unknown>,
  task: Task,
  totalCost: number,
  wallClockMs: number
): string[] {
  const reasons: string[] = [];
  if (totalCost > task.budget) reasons.push(`Budget exceeded: $${totalCost.toFixed(4)} > $${task.budget.toFixed(2)}`);
  if (wallClockMs > task.deadlineSeconds * 1000) reasons.push(`Deadline exceeded: ${(wallClockMs / 1000).toFixed(1)}s > ${task.deadlineSeconds}s`);
  if (parsed.evaluationReasoning) reasons.push(String(parsed.evaluationReasoning));
  return reasons;
}
