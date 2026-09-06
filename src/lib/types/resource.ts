// ============================================================
// Resource Types — Agent Resource Exchange
// ============================================================

import { z } from 'zod';

// ----------------------------------------------------------
// Resource Pool — tracks all available resources for a run
// ----------------------------------------------------------

export const ResourcePoolSchema = z.object({
  moneyRemaining: z.number().nonnegative(),
  moneyTotal: z.number().positive(),
  moneySpent: z.number().nonnegative().default(0),
  moneyReserved: z.number().nonnegative().default(0),
  tokensRemaining: z.number().int().nonnegative(),
  tokensTotal: z.number().int().positive(),
  tokensUsed: z.number().int().nonnegative().default(0),
  toolCallsRemaining: z.number().int().nonnegative(),
  toolCallsTotal: z.number().int().positive(),
  toolCallsUsed: z.number().int().nonnegative().default(0),
  timeRemainingMs: z.number().int().nonnegative(),
  timeDeadlineMs: z.number().int().positive(),
  startedAtMs: z.number().int().positive(),
  concurrencyRemaining: z.number().int().nonnegative(),
  concurrencyMax: z.number().int().positive(),
});
export type ResourcePool = z.infer<typeof ResourcePoolSchema>;

// ----------------------------------------------------------
// Resource Request — agent asks for resources before execution
// ----------------------------------------------------------

export const ResourceRequestSchema = z.object({
  agentId: z.string().min(1),
  agentName: z.string().min(1),
  estimatedTokens: z.number().int().positive(),
  estimatedToolCalls: z.number().int().nonnegative().default(0),
  estimatedCost: z.number().positive(),
  estimatedLatencyMs: z.number().int().positive(),
});
export type ResourceRequest = z.infer<typeof ResourceRequestSchema>;

// ----------------------------------------------------------
// Resource Decision — exchange's response to a request
// ----------------------------------------------------------

export const ResourceDecisionSchema = z.object({
  type: z.enum(['APPROVE', 'PARTIAL', 'DEFER', 'REJECT', 'RECLAIM']),
  requestedBy: z.string().min(1),
  approved: z.object({
    tokens: z.number().int().nonnegative(),
    toolCalls: z.number().int().nonnegative(),
    cost: z.number().nonnegative(),
    latencyMs: z.number().int().nonnegative(),
  }),
  reason: z.string().min(1),
  expectedBenefit: z.string().optional(),
  estimatedCost: z.number().nonnegative().optional(),
  currentMarginalValue: z.number().optional(),
  alternativeOptions: z.array(z.string()).optional(),
  timestamp: z.number().int().positive(),
});
export type ResourceDecision = z.infer<typeof ResourceDecisionSchema>;

// ----------------------------------------------------------
// Resource Reallocation — when money moves between agents
// ----------------------------------------------------------

export const ResourceReallocationSchema = z.object({
  fromAgentId: z.string().min(1),
  fromAgentName: z.string().min(1),
  toAgentId: z.string().min(1),
  toAgentName: z.string().min(1),
  amount: z.number().positive(),
  reason: z.string().min(1),
  expectedBenefit: z.string().min(1),
  timestamp: z.number().int().positive(),
});
export type ResourceReallocation = z.infer<typeof ResourceReallocationSchema>;

// ----------------------------------------------------------
// Agent Allocation Snapshot
// ----------------------------------------------------------

export interface AgentAllocation {
  agentId: string;
  agentName: string;
  allocated: number;
  spent: number;
  remaining: number;
  tokensAllocated: number;
  tokensUsed: number;
}

// ----------------------------------------------------------
// Pluggable Scoring Interface
// ----------------------------------------------------------

export interface ResourceScoringInput {
  expectedMarginalOutcomeGain: number;
  resourceCost: number;
  estimatedLatencyMs: number;
  reliabilityImpact: number;
  resourceScarcity: number; // 0 = abundant, 1 = critically scarce
  timeRemainingMs: number;
  budgetRemainingRatio: number;
}

export interface ResourceScoringResult {
  priority: number;
  breakdown: {
    gainScore: number;
    costPenalty: number;
    latencyPenalty: number;
    scarcityPenalty: number;
  };
  recommendation: 'APPROVE' | 'PARTIAL' | 'DEFER' | 'REJECT';
}
