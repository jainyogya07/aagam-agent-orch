// ============================================================
// Evaluation Types — Agent Resource Exchange
// ============================================================

import { z } from 'zod';
import type { Claim, EvidenceItem } from '@/lib/types/claims';

// ----------------------------------------------------------
// Evaluation Result
// ----------------------------------------------------------

export const EvaluationResultSchema = z.object({
  qualityScore: z.number().min(0).max(1),
  reliabilityScore: z.number().min(0).max(1),
  evidenceScore: z.number().min(0).max(1),
  constraintCompliance: z.object({
    budgetMet: z.boolean(),
    deadlineMet: z.boolean(),
    reliabilityMet: z.boolean(),
    budgetUsed: z.number().nonnegative(),
    timeUsedMs: z.number().int().nonnegative(),
  }),
  failureReasons: z.array(z.string()).default([]),
  evaluationMethod: z.string().min(1),
  rawResponse: z.string().optional(),
});
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

// ----------------------------------------------------------
// Agent Contribution
// ----------------------------------------------------------

export const AgentContributionSchema = z.object({
  agentId: z.string().min(1),
  agentName: z.string().min(1),
  marginalQualityGain: z.number(), // can be negative
  reliabilityGain: z.number(),
  cost: z.number().nonnegative(),
  latencyMs: z.number().int().nonnegative(),
  evidenceGain: z.number(),
  confidence: z.number().min(0).max(1),
  uniqueInsights: z.number().int().nonnegative().default(0),
  redundancyRatio: z.number().min(0).max(1).default(0), // 0 = all unique, 1 = fully redundant
  costEfficiency: z.number().default(0), // quality gain per dollar
});
export type AgentContribution = z.infer<typeof AgentContributionSchema>;

// ----------------------------------------------------------
// Mutation Proposal
// ----------------------------------------------------------

export const MutationProposalSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'ADD_AGENT',
    'REMOVE_AGENT',
    'REWIRE',
    'CHANGE_MODEL',
    'CHANGE_TOOL',
    'CHANGE_RESOURCE_ALLOCATION',
    'CHANGE_EXECUTION_POLICY',
  ]),
  targetNodeId: z.string().nullable().default(null),
  reason: z.string().min(1),
  expectedImprovement: z.string().min(1),
  estimatedCost: z.number().nonnegative().optional(),
  risk: z.string().min(1),
  // Mutation-specific payload
  payload: z.record(z.string(), z.unknown()).optional(),
});
export type MutationProposal = z.infer<typeof MutationProposalSchema>;

// ----------------------------------------------------------
// Execution Result (from AgentRunner)
// ----------------------------------------------------------

export interface AgentExecutionResult {
  agentId: string;
  agentName: string;
  output: string;
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  cost: number;
  latencyMs: number;
  toolCalls: ToolCallRecord[];
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMEOUT';
  error?: string;
  evidence: string[];
  claims?: Claim[];
  evidenceItems?: EvidenceItem[];
  traceId: string;
  model: string;
  startedAt: number;
  completedAt: number;
}

export interface ToolCallRecord {
  toolId: string;
  toolName: string;
  input: unknown;
  output: unknown;
  cost: number;
  latencyMs: number;
  success: boolean;
}
