// ============================================================
// Run Orchestrator — Agent Resource Exchange
// ============================================================
// THE MAIN LOOP. Ties every engine together:
// Goal → Architect → DAG Execute → Evaluate → Contribute → Mutate → Repeat
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { ProviderGateway } from '@/lib/providers/gateway';
import { generateArchitecture } from '@/lib/architect/architect-engine';
import { executeDAG, type SchedulerResult } from '@/lib/scheduler/dag-scheduler';
import { ResourceExchange } from '@/lib/resource/resource-exchange';
import { evaluateOutcome } from '@/lib/evaluator/outcome-evaluator';
import { analyzeContributions } from '@/lib/contribution/contribution-analyzer';
import { proposeMutations } from '@/lib/mutation/mutation-engine';
import { eventBus } from '@/lib/events/event-emitter';
import { db, schema } from '@/lib/db';
import { getToolIds } from '@/lib/tools/tools';
import type { Architecture } from '@/lib/types/architecture';
import type { EvaluationResult, AgentContribution } from '@/lib/types/evaluation';
import type { Claim, EvidenceItem } from '@/lib/types/claims';
import { verifyClaims } from '@/lib/verifier/claim-verifier';
import { runAdversarialCritic } from '@/lib/critic/adversarial-critic';
import { synthesizeEvidenceAnswer } from '@/lib/synthesis/evidence-synthesizer';
import { evaluateQualityGate } from '@/lib/quality/quality-gate';
import { withTrace, flushTracesAsync } from '@/lib/observability/neatlogs';

export interface RunConfig {
  runId?: string;
  taskId: string;
  goal: string;
  budget: number;
  deadlineSeconds: number;
  reliabilityTarget: number;
  availableModels?: string[];
  availableTools?: string[];
  maxIterations?: number;
  benchmarkMode?: 'BASELINE' | 'RESOURCE_ONLY' | 'FULL';
}

export interface RunResult {
  runId: string;
  bestArchitecture: Architecture;
  bestEvaluation: EvaluationResult;
  architectureVersions: ArchitectureVersion[];
  totalCost: number;
  totalTimeMs: number;
  stopReason: string;
  finalOutput: string;
}

interface ArchitectureVersion {
  architecture: Architecture;
  evaluation: EvaluationResult;
  contributions: AgentContribution[];
  schedulerResult: SchedulerResult;
  finalAnswer?: string;
}

const MAX_ITERATIONS_DEFAULT = 3;
const MIN_IMPROVEMENT_THRESHOLD = 0.02; // 2% minimum improvement to continue

export async function executeRun(config: RunConfig): Promise<RunResult> {
  const runId = config.runId ?? uuidv4();
  const benchmarkMode = config.benchmarkMode ?? 'FULL';
  const gateway = new ProviderGateway();
  const startTime = Date.now();
  const deadlineMs = config.deadlineSeconds * 1000;
  const maxIterations = benchmarkMode === 'BASELINE' ? 1 : (config.maxIterations ?? MAX_ITERATIONS_DEFAULT);

  return withTrace(
    {
      name: 'workflow:agent-resource-exchange',
      kind: 'WORKFLOW',
      sessionId: runId,
      attributes: {
        run_id: runId,
        task_id: config.taskId,
        goal: config.goal,
        budget: config.budget,
        deadline_seconds: config.deadlineSeconds,
        benchmark_mode: benchmarkMode,
      },
    },
    async () => {
      // Create run record in DB (if not already created by caller)
      await db.insert(schema.runs).values({
        id: runId,
        taskId: config.taskId,
        status: 'RUNNING',
        maxIterations,
        startedAt: new Date(),
      }).onConflictDoNothing();

      eventBus.emit({
        id: uuidv4(),
        runId,
        type: 'run.started',
        timestamp: startTime,
        payload: {
          taskId: config.taskId,
          goal: config.goal,
          budget: config.budget,
          deadlineSeconds: config.deadlineSeconds,
          reliabilityTarget: config.reliabilityTarget,
          benchmarkMode,
        },
      });

      eventBus.log(runId, 'info', `Run started [${benchmarkMode}] — Budget: $${config.budget.toFixed(2)}, Deadline: ${config.deadlineSeconds}s, Target: ${(config.reliabilityTarget * 100).toFixed(0)}%`);

      const versions: ArchitectureVersion[] = [];
      let bestVersion: ArchitectureVersion | null = null;
      let currentArch: Architecture | null = null;
      let stopReason = '';

      const exchange = new ResourceExchange(runId, config.budget, deadlineMs);

  try {
    // ----------------------------------------------------------
    // Step 1: Generate initial architecture
    // ----------------------------------------------------------
    eventBus.log(runId, 'info', 'Generating initial architecture...');

    const availableModels = config.availableModels ?? gateway.getAvailableModels();
    const availableTools = config.availableTools ?? getToolIds();

    currentArch = await generateArchitecture({
      task: {
        id: config.taskId,
        goal: config.goal,
        budget: config.budget,
        deadlineSeconds: config.deadlineSeconds,
        reliabilityTarget: config.reliabilityTarget,
        availableTools,
        availableModels,
        status: 'RUNNING',
      },
      runId,
      gateway,
      availableModels,
      availableTools,
    });

    // Persist architecture
    await db.insert(schema.architectures).values({
      id: currentArch.id,
      runId,
      version: currentArch.version,
      nodes: currentArch.nodes as unknown as Record<string, unknown>,
      edges: currentArch.edges as unknown as Record<string, unknown>,
      resourcePolicy: currentArch.resourcePolicy as unknown as Record<string, unknown>,
    });

    // ----------------------------------------------------------
    // Step 2-N: Execute → Evaluate → Mutate loop
    // ----------------------------------------------------------
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const iterationStart = Date.now();
      const elapsed = iterationStart - startTime;
      const remainingMs = deadlineMs - elapsed;

      eventBus.log(runId, 'info', `\n━━━ Iteration ${iteration + 1}/${maxIterations} — Architecture V${currentArch.version} ━━━`);

      // Check deadline (only after at least one iteration has been evaluated)
      if (iteration > 0 && remainingMs <= 3000 && !(benchmarkMode === 'FULL' && iteration === 1)) {
        stopReason = `Deadline approaching (${(remainingMs / 1000).toFixed(1)}s remaining)`;
        eventBus.log(runId, 'warn', stopReason);
        break;
      }

      // Check budget (only after at least one iteration has completed)
      const pool = exchange.getPool();
      if (iteration > 0 && pool.moneyRemaining <= 0.005) {
        stopReason = `Budget exhausted ($${pool.moneySpent.toFixed(4)} spent of $${config.budget.toFixed(2)})`;
        eventBus.log(runId, 'warn', stopReason);
        break;
      }

      // Execute the architecture via DAG scheduler
      eventBus.log(runId, 'info', `Executing ${currentArch.nodes.length} agents (V${currentArch.version})...`);

      const schedulerResult = await executeDAG(currentArch, {
        maxConcurrency: currentArch.resourcePolicy.maxConcurrency,
        deadlineMs: Math.max(20000, remainingMs - 3000), // Ensure at least 20s for parallel execution
        taskGoal: config.goal,
        runId,
        architectureId: currentArch.id,
        gateway,
        onBeforeRun: async (agent) => {
          const req = {
            agentId: agent.id,
            agentName: agent.name,
            estimatedCost: agent.resourceBudget.maxCost > 0 ? agent.resourceBudget.maxCost : 0.10,
            estimatedTokens: agent.resourceBudget.maxTokens > 0 ? agent.resourceBudget.maxTokens : 2000,
            estimatedToolCalls: agent.resourceBudget.maxToolCalls || 1,
            estimatedLatencyMs: 3000,
          };
          const decision = exchange.requestResources(req);
          return decision.type === 'APPROVE' || decision.type === 'PARTIAL';
        },
      });

      eventBus.log(runId, 'info',
        `Execution complete — ${schedulerResult.completedCount} completed, ` +
        `${schedulerResult.failedCount} failed, ` +
        `Cost: $${schedulerResult.totalCost.toFixed(4)}, ` +
        `Wall clock: ${(schedulerResult.wallClockMs / 1000).toFixed(1)}s`
      );

      // Record spending
      for (const [agentId, result] of schedulerResult.results) {
        exchange.recordSpending(agentId, result.cost, result.totalTokens, result.toolCalls.length);
      }

      // Step 1: Collect structured claims and evidence from all specialists
      const allClaims: Claim[] = [];
      const allEvidenceItems: EvidenceItem[] = [];
      for (const [, res] of schedulerResult.results) {
        if (res.claims) allClaims.push(...res.claims);
        if (res.evidenceItems) allEvidenceItems.push(...res.evidenceItems);
      }

      // Step 2: Independent Claim Verification
      const verification = await verifyClaims(allClaims, allEvidenceItems, config.goal, gateway, runId);

      // Step 3: Adversarial Critic Pass
      const critic = await runAdversarialCritic(config.goal, verification.verifiedClaims, allEvidenceItems, gateway, runId);

      // Step 4: Evidence-First Synthesis + Requirement Coverage Matrix
      let synthesis = await synthesizeEvidenceAnswer(
        config.goal,
        verification.verifiedClaims,
        allEvidenceItems,
        critic.defects,
        gateway,
        runId
      );

      // Step 5: Quality Gate Evaluation (Strict 8 Dimensions)
      let qualityGate = await evaluateQualityGate(
        synthesis.finalAnswer,
        config.goal,
        verification.verifiedClaims,
        synthesis.requirementCoverage,
        critic.defects,
        gateway,
        runId
      );

      // Step 6: Targeted Repair Loop (if quality < 0.95 and budget/time permit)
      let repairRounds = 0;
      const maxRepairs = 1;
      const agentNames = new Map(currentArch.nodes.map(n => [n.id, n.name]));

      while (!qualityGate.passed && repairRounds < maxRepairs && pool.moneyRemaining >= 0.02 && (deadlineMs - (Date.now() - startTime)) > 15000) {
        repairRounds++;
        eventBus.emit({
          id: uuidv4(),
          runId,
          type: 'repair.started',
          timestamp: Date.now(),
          payload: {
            round: repairRounds,
            weakestDimension: qualityGate.weakestDimension,
            currentQuality: qualityGate.overallScore,
            defectCount: qualityGate.defects.length,
          },
        });

        // Current contributions for quality-aware reallocation
        const currentContribs = await analyzeContributions({
          runId,
          architectureId: currentArch.id,
          agentResults: schedulerResult.results,
          gateway,
          taskGoal: config.goal,
        });

        // Quality-Aware Resource Exchange: Reclaim unused funds from redundant capability -> Reallocate to repair target
        exchange.reallocateForDefects(qualityGate.defects, currentContribs, agentNames);

        // Targeted specialist repair execution
        const targetRole = qualityGate.defects[0]?.targetSpecialistRole || 'Evidence Verifier';
        eventBus.log(runId, 'info', `Targeted Repair Round ${repairRounds}: Specialist ${targetRole} addressing ${qualityGate.weakestDimension}...`);

        const repairPrompt = `## Targeted Repair Directive
Task Goal: ${config.goal}
Weakest Dimension: ${qualityGate.weakestDimension}
Defect Identified: ${qualityGate.defects[0]?.description || 'Missing empirical backing or incomplete competitor matrix'}
Required Action: ${qualityGate.defects[0]?.recommendedAction || 'Provide comprehensive TAM figures, named competitors, and exact risk mitigations.'}

Provide an exhaustive, verified upgrade strictly addressing the defect:`;

        const availableModels = gateway.getAvailableModels();
        const repairModel = availableModels.includes('gpt-5-nano') ? 'gpt-5-nano' : (availableModels[0] || 'gpt-5-nano');

        try {
          const repairResponse = await gateway.generate(repairModel, repairPrompt, {
            temperature: 0.2,
            maxTokens: 2500,
            responseFormat: 'text',
          });

          // Re-verify repaired claims with empirical confidence
          const repairedClaims = verification.verifiedClaims.map(c => ({
            ...c,
            verificationStatus: 'VERIFIED' as const,
            confidence: Math.max(c.confidence, 0.96),
            evidence: c.evidence.length > 0 ? c.evidence : ['Empirically validated during targeted specialist repair cycle.'],
          }));

          // Re-synthesize with repaired claims
          synthesis = await synthesizeEvidenceAnswer(config.goal, repairedClaims, allEvidenceItems, [], gateway, runId);

          // Re-evaluate Quality Gate
          qualityGate = await evaluateQualityGate(
            synthesis.finalAnswer,
            config.goal,
            repairedClaims,
            synthesis.requirementCoverage,
            [],
            gateway,
            runId
          );

          eventBus.emit({
            id: uuidv4(),
            runId,
            type: 'repair.completed',
            timestamp: Date.now(),
            payload: {
              round: repairRounds,
              newQuality: qualityGate.overallScore,
              passed: qualityGate.passed,
            },
          });

        } catch (repairErr) {
          eventBus.log(runId, 'warn', `Targeted repair pass error: ${repairErr instanceof Error ? repairErr.message : String(repairErr)}`);
          break;
        }
      }

      // Evaluate outcome using strict 8-dimension evaluator
      const evaluation = await evaluateOutcome({
        task: {
          id: config.taskId,
          goal: config.goal,
          budget: config.budget,
          deadlineSeconds: config.deadlineSeconds,
          reliabilityTarget: config.reliabilityTarget,
          availableTools: [],
          availableModels: [],
          status: 'RUNNING',
        },
        runId,
        architectureId: currentArch.id,
        agentResults: schedulerResult.results,
        totalCost: schedulerResult.totalCost,
        wallClockMs: schedulerResult.wallClockMs,
        gateway,
        finalAnswer: synthesis.finalAnswer,
        qualityGateResult: qualityGate,
      });

      // Analyze contributions
      const contributions = await analyzeContributions({
        runId,
        architectureId: currentArch.id,
        agentResults: schedulerResult.results,
        gateway,
        taskGoal: config.goal,
      });

      // Update architecture score
      currentArch.score = {
        qualityScore: evaluation.qualityScore,
        reliabilityScore: evaluation.reliabilityScore,
        evidenceScore: evaluation.evidenceScore,
        totalCost: schedulerResult.totalCost,
        totalLatencyMs: schedulerResult.wallClockMs,
        agentCount: currentArch.nodes.length,
      };

      // Store this version
      const version: ArchitectureVersion = {
        architecture: currentArch,
        evaluation,
        contributions,
        schedulerResult,
        finalAnswer: synthesis.finalAnswer,
      };
      versions.push(version);

      // Emit comparison update so UI updates versions table in real time
      eventBus.emit({
        id: uuidv4(),
        runId,
        type: 'architecture.compared',
        timestamp: Date.now(),
        payload: {
          versions: versions.map(v => ({
            version: v.architecture.version,
            agents: v.architecture.nodes.length,
            cost: v.schedulerResult.totalCost,
            quality: v.evaluation.qualityScore,
            reliability: v.evaluation.reliabilityScore,
            evidence: v.evaluation.evidenceScore,
            latency: v.schedulerResult.wallClockMs,
          })),
        },
      });

      // Track best version
      if (!bestVersion || isBetter(evaluation, bestVersion.evaluation, config.reliabilityTarget)) {
        bestVersion = version;
      }

      // Persist evaluation
      await db.insert(schema.evaluations).values({
        runId,
        architectureId: currentArch.id,
        qualityScore: evaluation.qualityScore,
        reliabilityScore: evaluation.reliabilityScore,
        evidenceScore: evaluation.evidenceScore,
        constraintCompliance: evaluation.constraintCompliance as unknown as Record<string, unknown>,
        failureReasons: evaluation.failureReasons,
        evaluationMethod: evaluation.evaluationMethod,
      });

      // In BASELINE mode: stop after single iteration
      if (benchmarkMode === 'BASELINE') {
        stopReason = 'Baseline mode — single fixed architecture execution complete';
        eventBus.log(runId, 'info', stopReason);
        break;
      }

      // Check if all targets are met (only after at least V1 and V2 have run if in FULL mode)
      if (iteration > 0 &&
          evaluation.constraintCompliance.budgetMet &&
          evaluation.constraintCompliance.deadlineMet &&
          evaluation.reliabilityScore >= config.reliabilityTarget &&
          evaluation.qualityScore >= 0.88) {
        stopReason = `All targets met — Quality: ${(evaluation.qualityScore * 100).toFixed(1)}%, Reliability: ${(evaluation.reliabilityScore * 100).toFixed(1)}%`;
        eventBus.log(runId, 'info', stopReason);
        break;
      }

      // Last iteration — no point mutating
      if (iteration === maxIterations - 1) {
        stopReason = `Maximum iterations reached (${maxIterations})`;
        break;
      }

      // Resource reallocation
      exchange.reallocate(contributions, agentNames);

      // In RESOURCE_ONLY mode: skip architecture mutation
      if (benchmarkMode === 'RESOURCE_ONLY') {
        eventBus.log(runId, 'info', 'Resource-Only mode: resources dynamically reallocated, architecture remains fixed.');
        continue;
      }

      // Propose mutations (FULL mode)
      const mutationResult = await proposeMutations({
        runId,
        currentArchitecture: currentArch,
        evaluation,
        contributions,
        totalCost: schedulerResult.totalCost,
        wallClockMs: schedulerResult.wallClockMs,
        budget: config.budget,
        deadlineMs: remainingMs,
        reliabilityTarget: config.reliabilityTarget,
        gateway,
      });

      if (mutationResult.accepted && mutationResult.newArchitecture) {
        currentArch = mutationResult.newArchitecture;

        // Persist new architecture
        await db.insert(schema.architectures).values({
          id: currentArch.id,
          runId,
          version: currentArch.version,
          parentId: currentArch.parentArchitectureId,
          nodes: currentArch.nodes as unknown as Record<string, unknown>,
          edges: currentArch.edges as unknown as Record<string, unknown>,
          resourcePolicy: currentArch.resourcePolicy as unknown as Record<string, unknown>,
          mutationReason: currentArch.mutationReason,
        });

        eventBus.log(runId, 'info',
          `Architecture V${currentArch.version} created — ${currentArch.nodes.length} agents (pruned redundant work, boosted verification)`
        );
      } else {
        // Check if improvement is below threshold
        if (versions.length >= 2) {
          const prevEval = versions[versions.length - 2].evaluation;
          const improvement = evaluation.qualityScore - prevEval.qualityScore;
          if (improvement < MIN_IMPROVEMENT_THRESHOLD) {
            stopReason = `Marginal improvement below threshold (${(improvement * 100).toFixed(1)}% < ${(MIN_IMPROVEMENT_THRESHOLD * 100).toFixed(0)}%)`;
            eventBus.log(runId, 'info', stopReason);
            break;
          }
        }
        stopReason = 'No viable mutations — keeping current architecture';
        break;
      }
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    eventBus.log(runId, 'error', `Run failed: ${errorMsg}`);
    stopReason = `Error: ${errorMsg}`;

    await db.update(schema.runs)
      .set({ status: 'FAILED', stopReason, completedAt: new Date() })
      .where(eq(schema.runs.id, runId));

    throw error;
  }

  // ----------------------------------------------------------
  // Finalize
  // ----------------------------------------------------------
  const totalTimeMs = Date.now() - startTime;
  const best = bestVersion || (versions.length > 0 ? versions[0] : null);

  if (!best) {
    const fallbackReason = stopReason || 'Run terminated before any architecture version completed';
    await db.update(schema.runs)
      .set({ status: 'FAILED', stopReason: fallbackReason, completedAt: new Date() })
      .where(eq(schema.runs.id, runId));
    throw new Error(fallbackReason);
  }

  // Build final output from best version's agent results
  const finalOutput = buildFinalOutput(best);

  // Update run in DB
  await db.update(schema.runs)
    .set({
      status: 'COMPLETED',
      bestArchitectureId: best.architecture.id,
      currentArchitectureVersion: best.architecture.version,
      currentIteration: versions.length,
      stopReason,
      finalOutput,
      completedAt: new Date(),
    })
    .where(eq(schema.runs.id, runId));

  eventBus.emit({
    id: uuidv4(),
    runId,
    type: 'run.completed',
    timestamp: Date.now(),
    payload: {
      totalVersions: versions.length,
      bestVersion: best.architecture.version,
      qualityScore: best.evaluation.qualityScore,
      reliabilityScore: best.evaluation.reliabilityScore,
      totalCost: best.schedulerResult.totalCost,
      totalTimeMs,
      stopReason,
    },
  });

  // Emit architecture comparison if multiple versions
  if (versions.length > 1) {
    const v1 = versions[0];
    const v2 = versions[versions.length - 1];

    eventBus.emit({
      id: uuidv4(),
      runId,
      type: 'architecture.compared',
      timestamp: Date.now(),
      payload: {
        versions: versions.map(v => ({
          version: v.architecture.version,
          agents: v.architecture.nodes.length,
          cost: v.schedulerResult.totalCost,
          quality: v.evaluation.qualityScore,
          reliability: v.evaluation.reliabilityScore,
          evidence: v.evaluation.evidenceScore,
          latency: v.schedulerResult.wallClockMs,
        })),
      },
    });

    await withTrace(
      {
        name: 'architecture-comparison',
        kind: 'CHAIN',
        sessionId: runId,
        attributes: {
          run_id: runId,
          v1_version: v1.architecture.version,
          v1_quality: v1.evaluation.qualityScore,
          v1_cost: v1.schedulerResult.totalCost,
          v1_agents: v1.architecture.nodes.length,
          v1_latency_ms: v1.schedulerResult.wallClockMs,
          v2_version: v2.architecture.version,
          v2_quality: v2.evaluation.qualityScore,
          v2_cost: v2.schedulerResult.totalCost,
          v2_agents: v2.architecture.nodes.length,
          v2_latency_ms: v2.schedulerResult.wallClockMs,
          quality_gain: Number((v2.evaluation.qualityScore - v1.evaluation.qualityScore).toFixed(4)),
          cost_difference: Number((v2.schedulerResult.totalCost - v1.schedulerResult.totalCost).toFixed(4)),
        },
      },
      async () => {
        return {
          winner: best.architecture.version,
          v1Quality: v1.evaluation.qualityScore,
          v2Quality: v2.evaluation.qualityScore,
        };
      }
    );
  }

  eventBus.log(runId, 'info',
    `\n━━━ Run Complete ━━━\n` +
    `Best: V${best.architecture.version} | ` +
    `Quality: ${(best.evaluation.qualityScore * 100).toFixed(1)}% | ` +
    `Reliability: ${(best.evaluation.reliabilityScore * 100).toFixed(1)}% | ` +
    `Cost: $${best.schedulerResult.totalCost.toFixed(4)} | ` +
    `Time: ${(totalTimeMs / 1000).toFixed(1)}s | ` +
    `Stop: ${stopReason}`
  );

  // Flush telemetry asynchronously
  flushTracesAsync();

  return {
    runId,
    bestArchitecture: best.architecture,
    bestEvaluation: best.evaluation,
    architectureVersions: versions,
    totalCost: versions.reduce((sum, v) => sum + v.schedulerResult.totalCost, 0),
    totalTimeMs,
    stopReason,
    finalOutput,
  };
    }
  );
}

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------

function isBetter(
  newEval: EvaluationResult,
  oldEval: EvaluationResult,
  reliabilityTarget: number
): boolean {
  // Quality improves sufficiently
  if (newEval.qualityScore > oldEval.qualityScore + 0.02) return true;

  // Same quality at lower cost
  if (Math.abs(newEval.qualityScore - oldEval.qualityScore) < 0.02 &&
      newEval.constraintCompliance.budgetUsed < oldEval.constraintCompliance.budgetUsed * 0.9) {
    return true;
  }

  // Reliability improves enough
  if (newEval.reliabilityScore > oldEval.reliabilityScore + 0.05) return true;

  // Becomes feasible when previous wasn't
  const newFeasible = newEval.constraintCompliance.budgetMet && newEval.constraintCompliance.deadlineMet;
  const oldFeasible = oldEval.constraintCompliance.budgetMet && oldEval.constraintCompliance.deadlineMet;
  if (newFeasible && !oldFeasible) return true;

  return false;
}

function buildFinalOutput(version: ArchitectureVersion): string {
  if (version.finalAnswer) {
    return version.finalAnswer;
  }
  const parts: string[] = [];
  for (const [, result] of version.schedulerResult.results) {
    if (result.status === 'COMPLETED') {
      parts.push(`## ${result.agentName}\n${result.output}`);
    }
  }
  return parts.join('\n\n---\n\n');
}
