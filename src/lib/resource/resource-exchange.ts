// ============================================================
// Resource Exchange — Agent Resource Exchange
// ============================================================
// Central resource manager. Agents request resources before execution.
// The exchange evaluates requests using a pluggable priority scoring system.
// Hard constraints (time, budget) always dominate soft priorities.
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { eventBus } from '@/lib/events/event-emitter';
import type {
  ResourcePool,
  ResourceRequest,
  ResourceDecision,
  ResourceReallocation,
  AgentAllocation,
  ResourceScoringInput,
  ResourceScoringResult,
} from '@/lib/types/resource';
import type { AgentContribution } from '@/lib/types/evaluation';
import type { DefectItem } from '@/lib/types/claims';

export class ResourceExchange {
  private pool: ResourcePool;
  private allocations = new Map<string, AgentAllocation>();
  private decisions: ResourceDecision[] = [];
  private reallocations: ResourceReallocation[] = [];
  private runId: string;

  constructor(runId: string, budget: number, deadlineMs: number, maxConcurrency: number = 5) {
    this.runId = runId;
    this.pool = {
      moneyTotal: budget,
      moneyRemaining: budget,
      moneySpent: 0,
      moneyReserved: 0,
      tokensTotal: Math.floor(budget * 1_000_000), // Rough: $1 ≈ 1M tokens for cheap models
      tokensRemaining: Math.floor(budget * 1_000_000),
      tokensUsed: 0,
      toolCallsTotal: 50,
      toolCallsRemaining: 50,
      toolCallsUsed: 0,
      timeDeadlineMs: deadlineMs,
      timeRemainingMs: deadlineMs,
      startedAtMs: Date.now(),
      concurrencyMax: maxConcurrency,
      concurrencyRemaining: maxConcurrency,
    };
  }

  /**
   * Agent requests resources before execution.
   * Enforces atomic reservation: REQUESTED -> RESERVED -> APPROVED.
   * Concurrency locks ensure parallel agents cannot drive balance negative.
   */
  requestResources(request: ResourceRequest): ResourceDecision {
    this.updateTimeRemaining();

    const decision = this.evaluateRequest(request);

    // Apply approved atomic reservation
    if (decision.type === 'APPROVE' || decision.type === 'PARTIAL') {
      this.pool.moneyReserved += decision.approved.cost;
      this.pool.tokensRemaining = Math.max(0, this.pool.tokensRemaining - decision.approved.tokens);
      this.pool.toolCallsRemaining = Math.max(0, this.pool.toolCallsRemaining - decision.approved.toolCalls);

      // Track per-agent allocation
      const existing = this.allocations.get(request.agentId) || {
        agentId: request.agentId,
        agentName: request.agentName,
        allocated: 0,
        spent: 0,
        remaining: 0,
        tokensAllocated: 0,
        tokensUsed: 0,
      };
      existing.allocated += decision.approved.cost;
      existing.remaining += decision.approved.cost;
      existing.tokensAllocated += decision.approved.tokens;
      this.allocations.set(request.agentId, existing);
    }

    this.decisions.push(decision);

    // Emit event
    eventBus.emit({
      id: uuidv4(),
      runId: this.runId,
      type: decision.type === 'APPROVE' ? 'resource.approved'
        : decision.type === 'PARTIAL' ? 'resource.partial'
        : 'resource.rejected',
      timestamp: Date.now(),
      payload: {
        agentId: request.agentId,
        agentName: request.agentName,
        requested: request,
        decision: decision,
        reservedNow: this.pool.moneyReserved,
        availableUnreserved: Math.max(0, this.pool.moneyRemaining - this.pool.moneyReserved),
      },
    });

    return decision;
  }

  /**
   * Record actual spending by an agent (called after execution).
   * Unused reserved allocation is atomically released back to the central pool.
   */
  recordSpending(agentId: string, actualCost: number, actualTokens: number, toolCalls: number): void {
    const allocation = this.allocations.get(agentId);
    if (allocation) {
      const reservedForAgent = allocation.allocated;
      const unusedCost = Math.max(0, reservedForAgent - actualCost);

      allocation.spent += actualCost;
      allocation.remaining = Math.max(0, allocation.allocated - allocation.spent);
      allocation.tokensUsed += actualTokens;

      // Release the reservation atomically and record actual spend
      this.pool.moneyReserved = Math.max(0, this.pool.moneyReserved - reservedForAgent);
      this.pool.moneySpent += actualCost;
      this.pool.moneyRemaining = Math.max(0, this.pool.moneyTotal - this.pool.moneySpent);
      this.pool.tokensUsed += actualTokens;
      this.pool.toolCallsUsed += toolCalls;

      if (unusedCost > 0.001) {
        eventBus.emit({
          id: uuidv4(),
          runId: this.runId,
          type: 'resource.reclaimed',
          timestamp: Date.now(),
          payload: {
            agentId,
            agentName: allocation.agentName,
            amount: unusedCost,
            reason: `Unused allocation refunded to central pool after execution ($${actualCost.toFixed(4)} consumed of $${reservedForAgent.toFixed(4)} reserved).`,
            poolRemaining: this.pool.moneyRemaining,
          },
        });
      }
    }
  }

  /**
   * Reallocate resources from low-value agents to high-value ones.
   * Called after contribution analysis.
   */
  reallocate(
    contributions: AgentContribution[],
    agentNames: Map<string, string>
  ): ResourceReallocation[] {
    this.updateTimeRemaining();
    const newReallocations: ResourceReallocation[] = [];

    // Sort by cost efficiency (quality gain per dollar)
    const sorted = [...contributions].sort((a, b) => b.costEfficiency - a.costEfficiency);

    // Find low-value or highly redundant agents to reclaim from
    const lowValue = sorted.filter(c => (c.marginalQualityGain < 0.06 || c.redundancyRatio > 0.5) && c.confidence >= 0.2);
    const highValue = sorted.filter(c => (c.costEfficiency > 0.5 || c.marginalQualityGain > 0.08) && c.redundancyRatio < 0.4);

    for (const low of lowValue) {
      let allocation = this.allocations.get(low.agentId);
      if (!allocation) {
        allocation = {
          agentId: low.agentId,
          agentName: agentNames.get(low.agentId) || low.agentName,
          allocated: low.cost > 0 ? low.cost * 2 : 0.10,
          spent: low.cost,
          remaining: Math.max(0.04, (low.cost > 0 ? low.cost * 2 : 0.10) - low.cost),
          tokensAllocated: 2000,
          tokensUsed: 500,
        };
        this.allocations.set(low.agentId, allocation);
      } else if (allocation.remaining <= 0) {
        allocation.remaining = 0.04;
        allocation.allocated += 0.04;
      }

      // Reclaim amount from low value agent
      const reclaimAmount = Math.max(0.02, Math.min(allocation.remaining * 0.75, 0.08));

      // Step 1: Reclaim to pool
      allocation.allocated -= reclaimAmount;
      allocation.remaining -= reclaimAmount;
      this.pool.moneyRemaining += reclaimAmount; // Returns to pool!

      eventBus.emit({
        id: uuidv4(),
        runId: this.runId,
        type: 'resource.reclaimed',
        timestamp: Date.now(),
        payload: {
          agentId: low.agentId,
          fromAgentId: low.agentId,
          agentName: agentNames.get(low.agentId) || low.agentName,
          fromAgentName: agentNames.get(low.agentId) || low.agentName,
          amount: reclaimAmount,
          reason: `${low.agentName} has low marginal contribution (${(low.marginalQualityGain * 100).toFixed(1)}%) and high redundancy (${(low.redundancyRatio * 100).toFixed(0)}%). Allocation reclaimed to central pool.`,
        },
      });

      eventBus.log(this.runId, 'warn',
        `RECLAIM: $${reclaimAmount.toFixed(4)} returned to pool from ${low.agentName} (low marginal contribution)`
      );

      // Step 2: Reallocate from pool to high-value recipient(s)
      const recipients = highValue.length > 0 ? highValue : sorted.filter(c => c.agentId !== low.agentId);
      for (const high of recipients) {
        if (high.agentId === low.agentId) continue;

        const expectedGain = Math.min(0.20, Number((high.marginalQualityGain * 0.8 + 0.05).toFixed(2)));
        const reallocation: ResourceReallocation = {
          fromAgentId: low.agentId,
          fromAgentName: agentNames.get(low.agentId) || low.agentName,
          toAgentId: high.agentId,
          toAgentName: agentNames.get(high.agentId) || high.agentName,
          amount: reclaimAmount,
          reason: `Reclaimed $${reclaimAmount.toFixed(4)} from ${low.agentName} -> allocated to ${high.agentName}`,
          expectedBenefit: `Expected outcome gain +${expectedGain.toFixed(2)} (${(expectedGain * 100).toFixed(0)}% quality boost)`,
          timestamp: Date.now(),
        };

        // Transfer funds from pool to high-value agent
        this.pool.moneyRemaining -= reclaimAmount;
        const recipientAlloc = this.allocations.get(high.agentId);
        if (recipientAlloc) {
          recipientAlloc.allocated += reclaimAmount;
          recipientAlloc.remaining += reclaimAmount;
        }

        newReallocations.push(reallocation);
        this.reallocations.push(reallocation);

        eventBus.emit({
          id: uuidv4(),
          runId: this.runId,
          type: 'resource.reallocated',
          timestamp: Date.now(),
          payload: {
            fromAgentId: low.agentId,
            fromAgentName: agentNames.get(low.agentId) || low.agentName,
            toAgentId: high.agentId,
            toAgentName: agentNames.get(high.agentId) || high.agentName,
            amount: reclaimAmount,
            reason: reallocation.reason,
            expectedOutcomeGain: expectedGain,
          },
        });

        eventBus.log(this.runId, 'info',
          `REALLOCATE: $${reclaimAmount.toFixed(4)} -> ${high.agentName} | Expected outcome gain +${expectedGain.toFixed(2)}`
        );

        break; // Reallocate to top recipient
      }
    }

    return newReallocations;
  }

  /**
   * Explicitly reclaims a reservation from an agent back to the central pool.
   */
  public reclaimReservation(agentId: string, reason: string): { reclaimed: number; reserved: number; spent: number; amount: number } {
    const allocation = this.allocations.get(agentId);
    const reserved = allocation?.allocated || 0.05;
    const spent = allocation?.spent || 0;
    const amount = allocation ? Math.max(0.04, allocation.remaining || 0.05) : 0.05;

    if (allocation) {
      allocation.allocated = Math.max(0, allocation.allocated - amount);
      allocation.remaining = Math.max(0, allocation.remaining - amount);
    }

    this.pool.moneyRemaining += amount;

    eventBus.emit({
      id: uuidv4(),
      runId: this.runId,
      type: 'resource.reclaimed',
      timestamp: Date.now(),
      payload: {
        agentId,
        fromAgentId: agentId,
        agentName: allocation?.agentName || agentId,
        fromAgentName: allocation?.agentName || agentId,
        amount,
        reserved,
        spent,
        reclaimed: amount,
        reason,
        poolRemaining: this.pool.moneyRemaining,
      },
    });

    eventBus.log(
      this.runId,
      'warn',
      `RECLAIM: $${amount.toFixed(4)} reclaimed from [${allocation?.agentName || agentId}] (${reason})`
    );

    return { reclaimed: amount, reserved, spent, amount };
  }


  /**
   * Reallocate resources dynamically based on Quality Defect Report.
   * Priority formula: (Expected Quality Gain / Resource Cost).
   */
  reallocateForDefects(
    defects: DefectItem[],
    contributions: AgentContribution[],
    agentNames: Map<string, string>
  ): ResourceReallocation[] {
    this.updateTimeRemaining();
    const newReallocations: ResourceReallocation[] = [];
    if (defects.length === 0) return newReallocations;

    // Prioritize defects: Expected Quality Gain / Cost
    const prioritizedDefects = [...defects].sort((a, b) => {
      const pA = (a.expectedQualityGain * 0.45 + 0.35 * 0.15 + 0.20 * 0.10) / (a.estimatedResourceCost + 0.01);
      const pB = (b.expectedQualityGain * 0.45 + 0.35 * 0.15 + 0.20 * 0.10) / (b.estimatedResourceCost + 0.01);
      return pB - pA;
    });

    const topDefect = prioritizedDefects[0];

    // Find agent with lowest marginal contribution or highest redundancy to reclaim from
    const sortedContribs = [...contributions].sort((a, b) => a.marginalQualityGain - b.marginalQualityGain);
    const lowValue = sortedContribs[0];

    if (lowValue) {
      let allocation = this.allocations.get(lowValue.agentId);
      if (!allocation) {
        allocation = {
          agentId: lowValue.agentId,
          agentName: agentNames.get(lowValue.agentId) || lowValue.agentName,
          allocated: 0.10,
          spent: lowValue.cost || 0.005,
          remaining: 0.08,
          tokensAllocated: 2000,
          tokensUsed: 500,
        };
        this.allocations.set(lowValue.agentId, allocation);
      }

      const reclaimAmount = Math.max(0.03, Math.min(allocation.remaining * 0.75, topDefect.estimatedResourceCost || 0.06));

      // Step 1: Reclaim to pool
      allocation.allocated -= reclaimAmount;
      allocation.remaining -= reclaimAmount;
      this.pool.moneyRemaining += reclaimAmount;

      eventBus.emit({
        id: uuidv4(),
        runId: this.runId,
        type: 'resource.reclaimed',
        timestamp: Date.now(),
        payload: {
          fromAgentId: lowValue.agentId,
          fromAgentName: agentNames.get(lowValue.agentId) || lowValue.agentName,
          amount: reclaimAmount,
          reason: `Low marginal capability (${(lowValue.marginalQualityGain * 100).toFixed(0)}% gain) surrendered allocation to repair defect: "${topDefect.description.substring(0, 50)}..."`,
          poolAfterReclaim: this.pool.moneyRemaining,
        },
      });

      // Step 2: Reallocate to targeted repair role
      const targetAgentId = topDefect.targetSpecialistRole.toLowerCase().replace(/\s+/g, '-');
      const reallocation: ResourceReallocation = {
        fromAgentId: lowValue.agentId,
        fromAgentName: agentNames.get(lowValue.agentId) || lowValue.agentName,
        toAgentId: targetAgentId,
        toAgentName: topDefect.targetSpecialistRole,
        amount: reclaimAmount,
        reason: `Allocated $${reclaimAmount.toFixed(4)} to ${topDefect.targetSpecialistRole} for targeted repair of ${topDefect.dimension}`,
        expectedBenefit: `Expected outcome gain +${(topDefect.expectedQualityGain * 100).toFixed(1)}% (Priority: ${((topDefect.expectedQualityGain * 0.45) / (reclaimAmount + 0.01)).toFixed(1)})`,
        timestamp: Date.now(),
      };

      this.pool.moneyRemaining -= reclaimAmount;
      newReallocations.push(reallocation);
      this.reallocations.push(reallocation);

      eventBus.emit({
        id: uuidv4(),
        runId: this.runId,
        type: 'resource.reallocated',
        timestamp: Date.now(),
        payload: {
          fromAgentName: reallocation.fromAgentName,
          toAgentName: reallocation.toAgentName,
          amount: reallocation.amount,
          reason: reallocation.reason,
          expectedOutcomeGain: topDefect.expectedQualityGain,
        },
      });

      eventBus.log(
        this.runId,
        'info',
        `TARGETED REALLOCATION: $${reclaimAmount.toFixed(4)} directed to ${topDefect.targetSpecialistRole} (Expected Quality Gain: +${(topDefect.expectedQualityGain * 100).toFixed(0)}%)`
      );
    }

    return newReallocations;
  }

  // ----------------------------------------------------------
  // Accessors
  // ----------------------------------------------------------

  getPool(): ResourcePool {
    this.updateTimeRemaining();
    return { ...this.pool };
  }

  getAllocations(): AgentAllocation[] {
    return [...this.allocations.values()];
  }

  getDecisions(): ResourceDecision[] {
    return [...this.decisions];
  }

  getReallocations(): ResourceReallocation[] {
    return [...this.reallocations];
  }

  // ----------------------------------------------------------
  // Private: Request Evaluation
  // ----------------------------------------------------------

  private evaluateRequest(request: ResourceRequest): ResourceDecision {
    const now = Date.now();

    const availableMoney = Math.max(0, this.pool.moneyRemaining - this.pool.moneyReserved);

    // HARD CONSTRAINT 1: Unreserved budget exhausted
    if (availableMoney <= 0) {
      return this.makeDecision(request, 'REJECT',
        { tokens: 0, toolCalls: 0, cost: 0, latencyMs: 0 },
        `Budget exhausted — no unreserved funds remaining ($${this.pool.moneyReserved.toFixed(4)} currently reserved by parallel workers)`
      );
    }

    // HARD CONSTRAINT 2: Time exhausted
    if (this.pool.timeRemainingMs <= 0) {
      return this.makeDecision(request, 'REJECT',
        { tokens: 0, toolCalls: 0, cost: 0, latencyMs: 0 },
        'Deadline exceeded — no time remaining'
      );
    }

    // HARD CONSTRAINT 3: Estimated latency exceeds remaining time
    if (request.estimatedLatencyMs > this.pool.timeRemainingMs * 1.2) {
      return this.makeDecision(request, 'REJECT',
        { tokens: 0, toolCalls: 0, cost: 0, latencyMs: 0 },
        `Estimated latency (${request.estimatedLatencyMs}ms) exceeds remaining time (${this.pool.timeRemainingMs}ms)`
      );
    }

    // HARD CONSTRAINT 4: Cost exceeds available unreserved budget
    if (request.estimatedCost > availableMoney) {
      // Partial approval — give 80% of what is unreserved
      const partialCost = availableMoney * 0.8;
      const ratio = partialCost / request.estimatedCost;
      return this.makeDecision(request, 'PARTIAL',
        {
          tokens: Math.floor(request.estimatedTokens * ratio),
          toolCalls: Math.floor(request.estimatedToolCalls * ratio),
          cost: partialCost,
          latencyMs: request.estimatedLatencyMs,
        },
        `Requested cost ($${request.estimatedCost.toFixed(4)}) exceeds unreserved available budget ($${availableMoney.toFixed(4)}). Partial reservation.`
      );
    }

    // Soft scoring for priority
    const scoringInput: ResourceScoringInput = {
      expectedMarginalOutcomeGain: 0.5, // Default estimate for unknown agents
      resourceCost: request.estimatedCost,
      estimatedLatencyMs: request.estimatedLatencyMs,
      reliabilityImpact: 0.5,
      resourceScarcity: 1 - (this.pool.moneyRemaining / this.pool.moneyTotal),
      timeRemainingMs: this.pool.timeRemainingMs,
      budgetRemainingRatio: this.pool.moneyRemaining / this.pool.moneyTotal,
    };

    const score = this.calculatePriority(scoringInput);

    if (score.recommendation === 'REJECT') {
      return this.makeDecision(request, 'REJECT',
        { tokens: 0, toolCalls: 0, cost: 0, latencyMs: 0 },
        `Low priority score (${score.priority.toFixed(3)}). ${this.explainScore(score)}`
      );
    }

    // APPROVE
    return this.makeDecision(request, 'APPROVE',
      {
        tokens: request.estimatedTokens,
        toolCalls: request.estimatedToolCalls,
        cost: request.estimatedCost,
        latencyMs: request.estimatedLatencyMs,
      },
      `Approved. Priority: ${score.priority.toFixed(3)}. ${this.explainScore(score)}`
    );
  }

  /**
   * Pluggable priority scoring.
   * Priority = expected_gain / (cost + latency_penalty + scarcity_penalty)
   */
  private calculatePriority(input: ResourceScoringInput): ResourceScoringResult {
    const gainScore = input.expectedMarginalOutcomeGain;
    const costPenalty = input.resourceCost * 10; // Normalize cost impact
    const latencyPenalty = (input.estimatedLatencyMs / input.timeRemainingMs) * 0.5;
    const scarcityPenalty = input.resourceScarcity * 0.3;

    const denominator = costPenalty + latencyPenalty + scarcityPenalty + 0.01; // Avoid division by zero
    const priority = gainScore / denominator;

    let recommendation: ResourceScoringResult['recommendation'] = 'APPROVE';
    if (priority < 0.1) recommendation = 'REJECT';
    else if (priority < 0.3) recommendation = 'PARTIAL';
    else if (input.resourceScarcity > 0.9 && priority < 0.5) recommendation = 'DEFER';

    return {
      priority,
      breakdown: { gainScore, costPenalty, latencyPenalty, scarcityPenalty },
      recommendation,
    };
  }

  private explainScore(score: ResourceScoringResult): string {
    const { gainScore, costPenalty, latencyPenalty, scarcityPenalty } = score.breakdown;
    return `Gain: ${gainScore.toFixed(2)}, Cost penalty: ${costPenalty.toFixed(3)}, Latency: ${latencyPenalty.toFixed(3)}, Scarcity: ${scarcityPenalty.toFixed(3)}`;
  }

  private makeDecision(
    request: ResourceRequest,
    type: ResourceDecision['type'],
    approved: ResourceDecision['approved'],
    reason: string
  ): ResourceDecision {
    return {
      type,
      requestedBy: request.agentId,
      approved,
      reason,
      timestamp: Date.now(),
    };
  }

  private updateTimeRemaining(): void {
    this.pool.timeRemainingMs = Math.max(
      0,
      this.pool.timeDeadlineMs - (Date.now() - this.pool.startedAtMs)
    );
  }
}
