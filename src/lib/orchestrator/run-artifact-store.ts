// ============================================================
// Run Artifact Store — Agent Resource Exchange
// ============================================================
// Creates a clean, auditable JSON review store on disk for every
// run under `./runs/[runId]/` as requested by judges and reviewers.
// Persists:
// task.json, task-spec.json, architecture-v1.json, architecture-v2.json,
// agents.json, sessions.json (including AO sessions), capabilities.json,
// resources.json, decisions.json, evidence.json, evaluations.json,
// mutations.json, final-result.json
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import type { OrchestratorRunResult } from './agent-orchestrator';
import { AOSessionAdapter } from '../runtime/ao/ao-session-adapter';

import { runsDir } from '@/lib/history/runs-dir';

export class RunArtifactStore {
  private static readonly RUNS_DIR = runsDir();

  /**
   * Persists all review artifacts for a completed run.
   */
  public static async persistRunReview(result: OrchestratorRunResult): Promise<string> {
    const runDir = path.join(this.RUNS_DIR, result.runId);

    if (!fs.existsSync(runDir)) {
      fs.mkdirSync(runDir, { recursive: true });
    }

    const safeWrite = (filename: string, data: unknown) => {
      fs.writeFileSync(
        path.join(runDir, filename),
        JSON.stringify(data, null, 2),
        'utf-8'
      );
    };

    // 1. task.json
    safeWrite('task.json', {
      runId: result.runId,
      taskId: result.taskSpec.rawGoal ? `task_${result.runId.slice(0, 8)}` : 'default',
      goal: result.taskSpec.rawGoal,
      status: 'COMPLETED',
      stopReason: result.stopReason,
      durationMs: result.totalTimeMs,
      totalCostUSD: result.totalCost,
    });

    // 2. task-spec.json
    safeWrite('task-spec.json', result.taskSpec);

    // 3. architecture-v1.json, architecture-v2.json, etc.
    for (const ver of result.architectureVersions) {
      safeWrite(`architecture-v${ver.architecture.version}.json`, {
        id: ver.architecture.id,
        version: ver.architecture.version,
        parentId: ver.architecture.parentArchitectureId,
        nodes: ver.architecture.nodes,
        edges: ver.architecture.edges,
        resourcePolicy: ver.architecture.resourcePolicy,
        mutationReason: ver.architecture.mutationReason,
        score: ver.architecture.score,
      });
    }

    // 4. agents.json
    const allAgents = result.architectureVersions.flatMap(v =>
      v.architecture.nodes.map(n => ({
        version: v.architecture.version,
        agentId: n.id,
        agentName: n.name,
        role: n.role,
        model: n.model,
        capabilities: n.tools,
        allocatedBudget: n.resourceBudget.maxCost,
        status: n.status,
      }))
    );
    safeWrite('agents.json', allAgents);

    // 5. sessions.json (including AO session mappings)
    const aoCorrelations = AOSessionAdapter.listCorrelations().filter(
      c => c.runId === result.runId
    );
    const sessionRecords = result.architectureVersions.flatMap(v =>
      Array.from(v.schedulerResult.results.values()).map(e => {
        const corr = aoCorrelations.find(c => c.agentId === e.agentId);
        return {
          version: v.architecture.version,
          agentId: e.agentId,
          agentName: e.agentName,
          status: e.status,
          model: e.model,
          cost: e.cost,
          latencyMs: e.latencyMs,
          traceId: e.traceId,
          aoSession: corr
            ? {
                aoSessionId: corr.aoSessionId,
                harness: corr.harness,
                worktreeBranch: corr.worktreeBranch,
                worktreePath: corr.worktreePath,
              }
            : null,
        };
      })
    );
    safeWrite('sessions.json', sessionRecords);

    // 6. capabilities.json
    const capabilityPurchases = result.architectureVersions.flatMap(v =>
      Array.from(v.schedulerResult.results.values()).flatMap(e =>
        e.toolCalls.map(t => ({
          version: v.architecture.version,
          agentId: e.agentId,
          toolId: t.toolId,
          toolName: t.toolName,
          cost: t.cost,
          latencyMs: t.latencyMs,
        }))
      )
    );
    safeWrite('capabilities.json', capabilityPurchases);

    // 7. resources.json
    const v1Cost = result.architectureVersions[0]?.schedulerResult.totalCost ?? 0;
    const v2Cost = result.architectureVersions[1]?.schedulerResult.totalCost ?? 0;
    safeWrite('resources.json', {
      totalBudgetUSD: result.taskSpec.effectiveBudgetUSD,
      totalCostUSD: result.totalCost,
      v1CostUSD: v1Cost,
      v2CostUSD: v2Cost,
      versions: result.architectureVersions.map(v => ({
        version: v.architecture.version,
        costUSD: v.schedulerResult.totalCost,
        latencyMs: v.schedulerResult.totalLatencyMs,
      })),
    });

    // 8. decisions.json
    const decisions = (await import('./decision-logger')).DecisionLogger.getDecisions(result.runId);
    safeWrite('decisions.json', decisions);

    // 9. evidence.json
    const allEvidence = result.architectureVersions.flatMap(v =>
      Array.from(v.schedulerResult.results.values()).flatMap(e => (e.evidence ?? []).map(ev => ({
        version: v.architecture.version,
        agentId: e.agentId,
        agentName: e.agentName,
        text: ev,
      })))
    );
    safeWrite('evidence.json', allEvidence);

    // 10. evaluations.json
    const evaluations = result.architectureVersions.map(v => ({
      version: v.architecture.version,
      evaluation: v.evaluation,
      contributions: v.contributions,
    }));
    safeWrite('evaluations.json', evaluations);

    // 11. mutations.json
    const mutations = result.architectureVersions.map(v => ({
      version: v.architecture.version,
      mutationReason: v.architecture.mutationReason,
    }));
    safeWrite('mutations.json', mutations);

    // 12. final-result.json
    safeWrite('final-result.json', {
      runId: result.runId,
      status: 'COMPLETED',
      stopReason: result.stopReason,
      bestVersion: result.bestArchitecture.version,
      finalOutput: result.finalOutput,
      overallQualityScore: result.bestEvaluation.qualityScore,
      overallReliabilityScore: result.bestEvaluation.reliabilityScore,
      totalCostUSD: result.totalCost,
      totalDurationMs: result.totalTimeMs,
    });

    return runDir;
  }
}
