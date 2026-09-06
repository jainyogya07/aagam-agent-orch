// ============================================================
// Decision Provenance Logger — Agent Resource Exchange
// ============================================================
// Records transparent, mathematical explanations for every major
// orchestrator decision (resource approval, pruning, model change,
// capability purchase, mutation).
// Enables UI and traces to explain: "Why was Finance Agent given $0.04?"
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { eventBus } from '@/lib/events/event-emitter';

export type DecisionType =
  | 'RESOURCE_APPROVAL'
  | 'RESOURCE_REALLOCATION'
  | 'CAPABILITY_PURCHASE'
  | 'CAPABILITY_SUBSTITUTION'
  | 'ARTIFACT_REUSE'
  | 'AGENT_SPAWN'
  | 'AGENT_PRUNE'
  | 'MODEL_MUTATION'
  | 'MUTATION_ACCEPTANCE'
  | 'ARCHITECTURE_REJECTION';

export interface OrchestratorDecisionRecord {
  decisionId: string;
  runId: string;
  architectureVersion: number;
  decisionType: DecisionType;
  targetAgentId?: string;
  targetAgentName?: string;
  inputState: Record<string, unknown>;
  candidateActions: string[];
  selectedAction: string;
  expectedValue: number;
  estimatedCostUSD: number;
  estimatedLatencyMs: number;
  marginalValue: number;
  confidence: number;
  reason: string;
  evidenceIds: string[];
  timestamp: number;
}

export class DecisionLogger {
  private static decisions = new Map<string, OrchestratorDecisionRecord[]>();

  /**
   * Logs an orchestrator decision record and emits an event.
   */
  public static logDecision(
    runId: string,
    architectureVersion: number,
    record: Omit<OrchestratorDecisionRecord, 'decisionId' | 'runId' | 'architectureVersion' | 'timestamp'>
  ): OrchestratorDecisionRecord {
    const fullRecord: OrchestratorDecisionRecord = {
      ...record,
      decisionId: uuidv4(),
      runId,
      architectureVersion,
      timestamp: Date.now(),
    };

    const existing = this.decisions.get(runId) ?? [];
    existing.push(fullRecord);
    this.decisions.set(runId, existing);

    eventBus.emit({
      id: uuidv4(),
      runId,
      type: 'decision.logged' as any,
      timestamp: fullRecord.timestamp,
      payload: fullRecord as unknown as Record<string, unknown>,
    });

    return fullRecord;
  }

  /**
   * Retrieves all logged decisions for a specific run.
   */
  public static getDecisions(runId: string): OrchestratorDecisionRecord[] {
    return this.decisions.get(runId) ?? [];
  }

  /**
   * Formats a human-readable explanation for judges and dashboards.
   */
  public static formatExplanation(decision: OrchestratorDecisionRecord): string {
    return `[Decision ${decision.decisionType}] ${decision.selectedAction}
Reason: ${decision.reason}
Expected Outcome Gain: +${(decision.expectedValue * 100).toFixed(1)}% | Cost: $${decision.estimatedCostUSD.toFixed(4)} | Marginal Value: ${decision.marginalValue.toFixed(2)}`;
  }
}
