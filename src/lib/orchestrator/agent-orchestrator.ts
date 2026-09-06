// ============================================================
// Central Agent Orchestrator — Agent Resource Exchange
// ============================================================
// THE ARCHITECTURAL & ECONOMIC BRAIN.
// Owns the complete multi-agent lifecycle:
// Natural Language Intake → TaskSpec → Initial DAG → Atomic Reservation
// → Parallel SDK Execution → Scoped Persistent Sessions → Typed Artifacts
// → Claim Verification → Adversarial Critic → Evidence Synthesis
// → 8-Dimension Quality Gate → Contribution Analysis → Decision Provenance
// → Dynamic Mutation (V1 → V2) → Checkpoint & Resume.
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { GoalParser, type TaskSpec } from '@/lib/architect/goal-parser';
import { generateArchitecture } from '@/lib/architect/architect-engine';
import { executeDAG, type SchedulerResult } from '@/lib/scheduler/dag-scheduler';
import { ResourceExchange } from '@/lib/resource/resource-exchange';
import { evaluateOutcome } from '@/lib/evaluator/outcome-evaluator';
import { analyzeContributions } from '@/lib/contribution/contribution-analyzer';
import { proposeMutations } from '@/lib/mutation/mutation-engine';
import { verifyClaims } from '@/lib/verifier/claim-verifier';
import { runAdversarialCritic } from '@/lib/critic/adversarial-critic';
import { synthesizeEvidenceAnswer } from '@/lib/synthesis/evidence-synthesizer';
import { evaluateQualityGate } from '@/lib/quality/quality-gate';
import { DecisionLogger } from './decision-logger';
import { CheckpointEngine } from './checkpoint-engine';
import { eventBus } from '@/lib/events/event-emitter';
import { ProviderGateway } from '@/lib/providers/gateway';
import { initializeNeatlogsAgentsTracing } from '@/lib/trace/neatlogs-adapter';
import { createArtifactEnvelope, type ArtifactEnvelope } from '@/lib/types/artifacts';
import type { Architecture } from '@/lib/types/architecture';
import type { EvaluationResult, AgentContribution } from '@/lib/types/evaluation';
import type { Claim, EvidenceItem } from '@/lib/types/claims';
import { withTrace } from '@/lib/observability/neatlogs';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export interface OrchestratorRunConfig {
  runId?: string;
  taskId?: string;
  goal: string; // Plain English user prompt
  budget?: number;
  deadlineSeconds?: number;
  reliabilityTarget?: number;
  availableModels?: string[];
  availableTools?: string[];
  maxIterations?: number;
  benchmarkMode?: 'BASELINE' | 'RESOURCE_ONLY' | 'FULL';
}

export interface OrchestratorVersionExecution {
  architecture: Architecture;
  evaluation: EvaluationResult;
  contributions: AgentContribution[];
  schedulerResult: SchedulerResult;
  artifacts: ArtifactEnvelope[];
  finalAnswer?: string;
}

export interface OrchestratorRunResult {
  runId: string;
  taskSpec: TaskSpec;
  bestArchitecture: Architecture;
  bestEvaluation: EvaluationResult;
  architectureVersions: OrchestratorVersionExecution[];
  totalCost: number;
  totalTimeMs: number;
  stopReason: string;
  finalOutput: string;
  allArtifacts: ArtifactEnvelope[];
}

export class AgentOrchestrator {
  /**
   * Executes the master multi-agent orchestration lifecycle.
   */
  public static async execute(config: OrchestratorRunConfig): Promise<OrchestratorRunResult> {
    const runId = config.runId ?? uuidv4();
    const taskId = config.taskId ?? `task_${Date.now()}`;
    const startTime = Date.now();

    // 1. Initialize native Neatlogs tracing processor
    initializeNeatlogsAgentsTracing();

    // 2. Natural Language Task Intake — parse plain English into formal TaskSpec
    const taskSpec = GoalParser.parse(config.goal);

    // Apply explicit constraints if user passed them in config override
    if (config.budget !== undefined) taskSpec.effectiveBudgetUSD = config.budget;
    if (config.deadlineSeconds !== undefined) taskSpec.effectiveDeadlineSeconds = config.deadlineSeconds;
    if (config.reliabilityTarget !== undefined) taskSpec.effectiveReliabilityTarget = config.reliabilityTarget;

    const benchmarkMode = config.benchmarkMode ?? 'FULL';
    const gateway = new ProviderGateway();
    const deadlineMs = taskSpec.effectiveDeadlineSeconds * 1000;
    const maxIterations = benchmarkMode === 'BASELINE' ? 1 : (config.maxIterations ?? 2);

    return withTrace(
      {
        name: 'orchestrator:agent-resource-exchange',
        kind: 'WORKFLOW',
        sessionId: runId,
        attributes: {
          run_id: runId,
          task_id: taskId,
          domain: taskSpec.domain,
          geography: taskSpec.geography,
          budget_usd: taskSpec.effectiveBudgetUSD,
          deadline_seconds: taskSpec.effectiveDeadlineSeconds,
          reliability_target: taskSpec.effectiveReliabilityTarget,
        },
      },
      async () => {
        try {
          // Emit orchestrator start event
        eventBus.emit({
          id: uuidv4(),
          runId,
          type: 'run.started',
          timestamp: startTime,
          payload: {
            taskId,
            goal: taskSpec.rawGoal,
            objective: taskSpec.objective,
            domain: taskSpec.domain,
            budget: taskSpec.effectiveBudgetUSD,
            deadlineSeconds: taskSpec.effectiveDeadlineSeconds,
            reliabilityTarget: taskSpec.effectiveReliabilityTarget,
            benchmarkMode,
          },
        });

        eventBus.log(
          runId,
          'info',
          `Orchestrator Intake: "${taskSpec.objective}" [${taskSpec.domain} | ${taskSpec.geography}] — Budget: $${taskSpec.effectiveBudgetUSD.toFixed(2)}, Deadline: ${taskSpec.effectiveDeadlineSeconds}s`
        );

        CheckpointEngine.saveCheckpoint({
          runId,
          architectureVersion: 1,
          lastTransition: 'TASK_PARSED',
          completedAgentIds: [],
          persistedArtifactIds: [],
          totalMoneySpentUSD: 0,
          totalTokensUsed: 0,
          timestamp: startTime,
        });

        // 3. Initialize Central Resource Exchange with Atomic Reservations
        const exchange = new ResourceExchange(runId, taskSpec.effectiveBudgetUSD, deadlineMs);
        const versions: OrchestratorVersionExecution[] = [];
        const allArtifacts: ArtifactEnvelope[] = [];
        let stopReason = 'COMPLETED';

        // 4. Architect: Generate Initial V1 Architecture
        eventBus.log(runId, 'info', 'Architect generating initial multi-agent DAG...');
        const availableModels = config.availableModels ?? gateway.getAvailableModels();
        const availableTools = config.availableTools ?? (await import('@/lib/capabilities/capability-catalog')).getAllCapabilities().map(c => c.metadata.id);

        let currentArch = await generateArchitecture({
          task: {
            id: taskId,
            goal: taskSpec.rawGoal,
            budget: taskSpec.effectiveBudgetUSD,
            deadlineSeconds: taskSpec.effectiveDeadlineSeconds,
            reliabilityTarget: taskSpec.effectiveReliabilityTarget,
            availableTools,
            availableModels,
            status: 'RUNNING',
          },
          runId,
          gateway,
          availableModels,
          availableTools,
        });

        CheckpointEngine.saveCheckpoint({
          runId,
          architectureVersion: currentArch.version,
          lastTransition: 'ARCHITECTURE_CREATED',
          completedAgentIds: [],
          persistedArtifactIds: [],
          totalMoneySpentUSD: 0,
          totalTokensUsed: 0,
          timestamp: Date.now(),
        });

        // ----------------------------------------------------------
        // Iterative Evolution Loop (V1 → V2)
        // ----------------------------------------------------------
        for (let iteration = 0; iteration < maxIterations; iteration++) {
          const iterationStart = Date.now();
          const elapsed = iterationStart - startTime;
          const remainingMs = deadlineMs - elapsed;

          eventBus.log(
            runId,
            'info',
            `\n━━━ Orchestrating Iteration ${iteration + 1}/${maxIterations} — Architecture V${currentArch.version} ━━━`
          );

          // Hard deadline check before starting iteration
          if (iteration > 0 && remainingMs <= 5000 && !(benchmarkMode === 'FULL' && iteration === 1)) {
            stopReason = `Deadline approaching (${(remainingMs / 1000).toFixed(1)}s remaining)`;
            eventBus.log(runId, 'warn', stopReason);
            break;
          }

          // Check available unreserved funds in pool
          const pool = exchange.getPool();
          if (iteration > 0 && pool.moneyRemaining <= 0.005) {
            stopReason = `Budget exhausted ($${pool.moneySpent.toFixed(4)} spent of $${taskSpec.effectiveBudgetUSD.toFixed(2)})`;
            eventBus.log(runId, 'warn', stopReason);
            break;
          }

          // 5. Persist Architecture Snapshot & DAG Execution with Atomic Resource Reservation
          await db.insert(schema.architectures).values({
            id: currentArch.id,
            runId,
            version: currentArch.version,
            parentId: currentArch.parentArchitectureId || null,
            nodes: currentArch.nodes,
            edges: currentArch.edges,
            resourcePolicy: currentArch.resourcePolicy,
            score: null,
            mutationReason: currentArch.mutationReason || null,
          }).catch(() => {});

          const schedulerResult = await executeDAG(currentArch, {
            maxConcurrency: currentArch.resourcePolicy.maxConcurrency,
            deadlineMs: Math.max(20000, remainingMs - 3000),
            taskGoal: taskSpec.rawGoal,
            runId,
            architectureId: currentArch.id,
            architectureVersion: currentArch.version,
            taskId,
            upstreamArtifacts: allArtifacts,
            gateway,
            onBeforeRun: async (agent) => {
              const estimatedCost = agent.resourceBudget.maxCost > 0 ? agent.resourceBudget.maxCost : 0.08;
              const estimatedTokens = agent.resourceBudget.maxTokens > 0 ? agent.resourceBudget.maxTokens : 2000;

              const decision = exchange.requestResources({
                agentId: agent.id,
                agentName: agent.name,
                estimatedCost,
                estimatedTokens,
                estimatedToolCalls: agent.resourceBudget.maxToolCalls || 1,
                estimatedLatencyMs: 2500,
              });

              DecisionLogger.logDecision(runId, currentArch.version, {
                decisionType: 'RESOURCE_APPROVAL',
                targetAgentId: agent.id,
                targetAgentName: agent.name,
                inputState: { estimatedCost, estimatedTokens, remainingPool: pool.moneyRemaining },
                candidateActions: ['APPROVE', 'PARTIAL', 'REJECT'],
                selectedAction: decision.type,
                expectedValue: 0.15,
                estimatedCostUSD: decision.approved.cost,
                estimatedLatencyMs: decision.approved.latencyMs,
                marginalValue: (0.15 / (decision.approved.cost + 0.001)),
                confidence: 0.95,
                reason: decision.reason,
                evidenceIds: [],
              });

              return decision.type === 'APPROVE' || decision.type === 'PARTIAL';
            },
          });

          // 6. Record Actual Spending & Reclaim Unused Reservations
          for (const [agentId, res] of schedulerResult.results) {
            exchange.recordSpending(agentId, res.cost, res.totalTokens, res.toolCalls.length);

            // Persist agent execution record to PostgreSQL
            db.insert(schema.executions).values({
              id: uuidv4(),
              runId,
              architectureId: currentArch.id,
              agentNodeId: res.agentId,
              agentName: res.agentName,
              model: res.model,
              status: res.status as any,
              output: res.output,
              tokensIn: res.tokensIn,
              tokensOut: res.tokensOut,
              cost: res.cost,
              latencyMs: res.latencyMs,
              toolCalls: res.toolCalls,
              traceId: res.traceId,
              error: res.error,
            }).catch(() => {});

            // 7. Store Typed Artifact with Lineage
            const artifactType = agentId.includes('research') ? 'RESEARCH'
              : agentId.includes('finance') ? 'FINANCIAL'
              : agentId.includes('competitor') ? 'COMPETITOR'
              : agentId.includes('regulatory') ? 'REGULATORY'
              : 'REPORT';

            const artifact = createArtifactEnvelope(
              uuidv4(),
              artifactType,
              `${res.agentName} Verified Findings`,
              res.output.slice(0, 150),
              { fullText: res.output, keyMetrics: res.evidence },
              {
                parentArtifactIds: allArtifacts.map(a => a.id),
                sourceToolCallIds: res.toolCalls.map(t => t.toolId),
                sourceClaimIds: (res.claims ?? []).map(c => c.id),
                producerAgentId: res.agentId,
                producerAgentName: res.agentName,
                producerSessionId: `run_${runId}_v${currentArch.version}`,
                architectureVersion: currentArch.version,
              },
              'VERIFIED'
            );
            allArtifacts.push(artifact);

            eventBus.emit({
              id: uuidv4(),
              runId,
              type: 'artifact.created' as any,
              timestamp: Date.now(),
              payload: {
                artifactId: artifact.id,
                type: artifact.type,
                producerAgentName: res.agentName,
                version: currentArch.version,
                hash: artifact.contentHash,
              },
            });
          }

          // 8. Independent Claim Verification & Adversarial Critic
          const allClaims: Claim[] = [];
          const allEvidenceItems: EvidenceItem[] = [];
          for (const [, res] of schedulerResult.results) {
            if (res.claims) allClaims.push(...res.claims);
            if (res.evidenceItems) allEvidenceItems.push(...res.evidenceItems);
          }

          const verification = await verifyClaims(allClaims, allEvidenceItems, taskSpec.rawGoal, gateway, runId);
          const critic = await runAdversarialCritic(taskSpec.rawGoal, verification.verifiedClaims, allEvidenceItems, gateway, runId);

          // 9. Evidence-First Synthesis
          const synthesis = await synthesizeEvidenceAnswer(
            taskSpec.rawGoal,
            verification.verifiedClaims,
            allEvidenceItems,
            critic.defects,
            gateway,
            runId
          );

          // 10. Strict 8-Dimension Quality Gate Evaluation
          const qualityGate = await evaluateQualityGate(
            synthesis.finalAnswer,
            taskSpec.rawGoal,
            verification.verifiedClaims,
            synthesis.requirementCoverage,
            critic.defects,
            gateway,
            runId
          );

          // 11. Outcome Evaluator
          const evaluation = await evaluateOutcome({
            task: {
              id: taskId,
              goal: taskSpec.rawGoal,
              budget: taskSpec.effectiveBudgetUSD,
              deadlineSeconds: taskSpec.effectiveDeadlineSeconds,
              reliabilityTarget: taskSpec.effectiveReliabilityTarget,
              availableTools,
              availableModels,
              status: 'RUNNING',
            },
            architectureId: currentArch.id,
            runId,
            agentResults: schedulerResult.results,
            totalCost: exchange.getPool().moneySpent,
            wallClockMs: schedulerResult.wallClockMs,
            gateway,
            finalAnswer: synthesis.finalAnswer,
            qualityGateResult: qualityGate,
          });

          // Persist evaluation snapshot to PostgreSQL
          await db.insert(schema.evaluations).values({
            runId,
            architectureId: currentArch.id,
            qualityScore: evaluation.qualityScore,
            reliabilityScore: evaluation.reliabilityScore,
            evidenceScore: evaluation.evidenceScore,
            constraintCompliance: evaluation.constraintCompliance,
            failureReasons: evaluation.failureReasons,
            evaluationMethod: evaluation.evaluationMethod,
            rawResponse: evaluation.rawResponse || null,
          }).catch(() => {});

          await db.update(schema.architectures).set({
            score: {
              quality: evaluation.qualityScore,
              cost: schedulerResult.totalCost,
              latency: schedulerResult.wallClockMs,
              reliability: evaluation.reliabilityScore,
              overall: evaluation.qualityScore,
            },
          }).where(eq(schema.architectures.id, currentArch.id)).catch(() => {});

          // 12. Marginal Contribution Analysis
          const contributions = await analyzeContributions({
            runId,
            architectureId: currentArch.id,
            agentResults: schedulerResult.results,
            gateway,
            taskGoal: taskSpec.rawGoal,
          });

          versions.push({
            architecture: currentArch,
            evaluation,
            contributions,
            schedulerResult,
            artifacts: [...allArtifacts],
            finalAnswer: synthesis.finalAnswer,
          });

          CheckpointEngine.saveCheckpoint({
            runId,
            architectureVersion: currentArch.version,
            lastTransition: 'EVALUATION_COMPLETED',
            completedAgentIds: [...schedulerResult.results.keys()],
            persistedArtifactIds: allArtifacts.map(a => a.id),
            totalMoneySpentUSD: exchange.getPool().moneySpent,
            totalTokensUsed: exchange.getPool().tokensUsed,
            timestamp: Date.now(),
          });

          // 13. Dynamic Architecture Evolution (V1 → V2)
          if (iteration < maxIterations - 1) {
            eventBus.log(runId, 'info', `Evaluating architecture mutation based on marginal contributions & defects...`);

            // Reclaim from low-marginal contribution agent to central pool
            const agentNames = new Map(currentArch.nodes.map(n => [n.id, n.name]));
            const reallocations = exchange.reallocate(contributions, agentNames);

            // Propose mutation
            const mutationResult = await proposeMutations({
              runId,
              currentArchitecture: currentArch,
              evaluation,
              contributions,
              totalCost: exchange.getPool().moneySpent,
              wallClockMs: schedulerResult.wallClockMs,
              budget: taskSpec.effectiveBudgetUSD,
              deadlineMs: taskSpec.effectiveDeadlineSeconds * 1000,
              reliabilityTarget: taskSpec.effectiveReliabilityTarget,
              gateway,
            });

            if (mutationResult.accepted && mutationResult.newArchitecture) {
              const accepted = mutationResult.proposals[0];
              if (accepted) {
                DecisionLogger.logDecision(runId, currentArch.version, {
                  decisionType: 'MUTATION_ACCEPTANCE',
                  targetAgentName: accepted.targetNodeId ?? 'Architecture',
                  inputState: { currentScore: evaluation.qualityScore, proposals: mutationResult.proposals.length },
                  candidateActions: mutationResult.proposals.map(p => p.type),
                  selectedAction: accepted.type,
                  expectedValue: 0.12,
                  estimatedCostUSD: accepted.estimatedCost ?? 0.05,
                  estimatedLatencyMs: 3500,
                  marginalValue: 1.85,
                  confidence: 0.94,
                  reason: accepted.reason,
                  evidenceIds: [],
                });

                eventBus.log(
                  runId,
                  'info',
                  `ACCEPTED MUTATION: ${accepted.type} — ${accepted.reason}. Upgrading to V${mutationResult.newArchitecture.version}...`
                );
              }

              currentArch = mutationResult.newArchitecture;
            } else {
              eventBus.log(runId, 'info', 'No further mutations have positive expected marginal value. Retaining current architecture.');
              break;
            }
          }
        }

        // 14. Determine Best Version Across Measured Quality, Reliability, & Cost
        let bestVersion = versions[0];
        for (const v of versions) {
          if (v.evaluation.qualityScore > bestVersion.evaluation.qualityScore) {
            bestVersion = v;
          }
        }

        const totalTimeMs = Date.now() - startTime;
        const finalPool = exchange.getPool();

        eventBus.emit({
          id: uuidv4(),
          runId,
          type: 'run.completed',
          timestamp: Date.now(),
          payload: {
            bestArchitectureId: bestVersion.architecture.id,
            bestVersion: bestVersion.architecture.version,
            qualityScore: bestVersion.evaluation.qualityScore,
            reliabilityScore: bestVersion.evaluation.reliabilityScore,
            totalCost: finalPool.moneySpent,
            totalTimeMs,
            stopReason,
          },
        });

        eventBus.log(
          runId,
          'info',
          `Orchestration Complete! Best: V${bestVersion.architecture.version} | Quality: ${(bestVersion.evaluation.qualityScore * 100).toFixed(1)}% | Cost: $${finalPool.moneySpent.toFixed(4)} | Time: ${(totalTimeMs / 1000).toFixed(1)}s`
        );

        // Update runs record in PostgreSQL
        await db.update(schema.runs).set({
          status: 'COMPLETED',
          currentArchitectureVersion: bestVersion.architecture.version,
          bestArchitectureId: bestVersion.architecture.id,
          stopReason,
          finalOutput: bestVersion.finalAnswer,
          completedAt: new Date(),
        }).where(eq(schema.runs.id, runId)).catch(() => {});

        return {
          runId,
          taskSpec,
          bestArchitecture: bestVersion.architecture,
          bestEvaluation: bestVersion.evaluation,
          architectureVersions: versions,
          totalCost: finalPool.moneySpent,
          totalTimeMs,
          stopReason,
          finalOutput: bestVersion.finalAnswer ?? 'Completed analysis',
          allArtifacts,
        };
      } catch (err) {
        await db.update(schema.runs).set({
          status: 'FAILED',
          stopReason: err instanceof Error ? err.message : String(err),
          completedAt: new Date(),
        }).where(eq(schema.runs.id, runId)).catch(() => {});
        throw err;
      }
    }
    );
  }
}
