// ============================================================
// Run Orchestrator — Agent Resource Exchange
// ============================================================
// Entrypoint for HTTP API routes and background execution tasks.
// Seamlessly delegates to the Central AgentOrchestrator while
// preserving 100% backward compatibility for existing routes.
// ============================================================

import { AgentOrchestrator, type OrchestratorRunResult } from './agent-orchestrator';
import type { Architecture } from '@/lib/types/architecture';
import type { EvaluationResult, AgentContribution } from '@/lib/types/evaluation';
import type { SchedulerResult } from '@/lib/scheduler/dag-scheduler';
import type { ArtifactEnvelope } from '@/lib/types/artifacts';

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

export interface ArchitectureVersion {
  architecture: Architecture;
  evaluation: EvaluationResult;
  contributions: AgentContribution[];
  schedulerResult: SchedulerResult;
  artifacts?: ArtifactEnvelope[];
  finalAnswer?: string;
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

/**
 * Main execution function invoked by Next.js API routes and benchmark scripts.
 */
export async function executeRun(config: RunConfig): Promise<RunResult> {
  const result: OrchestratorRunResult = await AgentOrchestrator.execute({
    runId: config.runId,
    taskId: config.taskId,
    goal: config.goal,
    budget: config.budget,
    deadlineSeconds: config.deadlineSeconds,
    reliabilityTarget: config.reliabilityTarget,
    availableModels: config.availableModels,
    availableTools: config.availableTools,
    maxIterations: config.maxIterations,
    benchmarkMode: config.benchmarkMode,
  });

  return {
    runId: result.runId,
    bestArchitecture: result.bestArchitecture,
    bestEvaluation: result.bestEvaluation,
    architectureVersions: result.architectureVersions,
    totalCost: result.totalCost,
    totalTimeMs: result.totalTimeMs,
    stopReason: result.stopReason,
    finalOutput: result.finalOutput,
  };
}
