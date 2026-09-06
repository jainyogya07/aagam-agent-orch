// ============================================================
// Capability Registry — Agent Resource Exchange
// ============================================================
// Defines metadata, pricing, latencies, schemas, and substitute
// relationships for all 35+ capabilities in the 6-class marketplace.
// ============================================================

import { z } from 'zod';

export type CapabilityClass =
  | 'INFORMATION'
  | 'COMPUTATION'
  | 'BUSINESS_INTELLIGENCE'
  | 'VERIFICATION'
  | 'COMMUNICATION'
  | 'EXECUTION';

export interface CapabilityCostModel {
  baseCostUSD: number;
  perUnitCostUSD?: number;
  currency: 'USD';
}

export interface CapabilityLatencyModel {
  estimatedMs: number;
  maxTimeoutMs: number;
}

export interface CapabilityMetadata {
  id: string;
  name: string;
  class: CapabilityClass;
  description: string;
  cost: CapabilityCostModel;
  latency: CapabilityLatencyModel;
  reliability: number; // 0.0 to 1.0
  evidenceStrength: number; // 0.0 to 1.0
  substitutes: string[]; // IDs of alternative capabilities if this one is unavailable/expensive
  inputSchema: z.ZodTypeAny;
  outputSchema: z.ZodTypeAny;
}

export interface CapabilityExecutionResult<T = unknown> {
  capabilityId: string;
  success: boolean;
  output: T;
  costUSD: number;
  latencyMs: number;
  error?: string;
  sourceReferences?: string[];
  executedAt: number;
}

export interface ExecutableCapability<TInput = any, TOutput = any> {
  metadata: CapabilityMetadata;
  execute: (input: TInput) => Promise<CapabilityExecutionResult<TOutput>>;
}
