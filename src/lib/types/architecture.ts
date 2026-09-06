// ============================================================
// Core Type Definitions — Agent Resource Exchange
// ============================================================
// Every architecture, agent, edge, and execution is strongly typed.
// Zod schemas provide runtime validation for LLM-generated architectures.
// ============================================================

import { z } from 'zod';

// ----------------------------------------------------------
// Enums
// ----------------------------------------------------------

export const AgentStatus = z.enum([
  'PENDING',
  'READY',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'BLOCKED',
]);
export type AgentStatus = z.infer<typeof AgentStatus>;

export const RunStatus = z.enum([
  'CREATED',
  'RUNNING',
  'EVALUATING',
  'MUTATING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'TIMEOUT',
]);
export type RunStatus = z.infer<typeof RunStatus>;

export const MutationType = z.enum([
  'ADD_AGENT',
  'REMOVE_AGENT',
  'REWIRE',
  'CHANGE_MODEL',
  'CHANGE_TOOL',
  'CHANGE_RESOURCE_ALLOCATION',
  'CHANGE_EXECUTION_POLICY',
]);
export type MutationType = z.infer<typeof MutationType>;

export const MutationStatus = z.enum([
  'PROPOSED',
  'ACCEPTED',
  'REJECTED',
]);
export type MutationStatus = z.infer<typeof MutationStatus>;

export const ResourceDecisionType = z.enum([
  'APPROVE',
  'PARTIAL',
  'DEFER',
  'REJECT',
  'RECLAIM',
]);
export type ResourceDecisionType = z.infer<typeof ResourceDecisionType>;

// ----------------------------------------------------------
// Agent Node
// ----------------------------------------------------------

export const AgentNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  objective: z.string().min(1),
  model: z.string().min(1),
  tools: z.array(z.string()).default([]),
  inputSchema: z.record(z.string(), z.unknown()).optional(),
  outputSchema: z.record(z.string(), z.unknown()).optional(),
  resourceBudget: z.object({
    maxCost: z.number().nonnegative(),
    maxTokens: z.number().int().nonnegative(),
    maxToolCalls: z.number().int().nonnegative(),
    maxLatencyMs: z.number().int().nonnegative().optional(),
  }),
  status: AgentStatus.default('PENDING'),
});
export type AgentNode = z.infer<typeof AgentNodeSchema>;

// ----------------------------------------------------------
// Edge (DAG connection)
// ----------------------------------------------------------

export const EdgeSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  condition: z.string().optional(),
  dataContract: z.string().optional(),
});
export type Edge = z.infer<typeof EdgeSchema>;

// ----------------------------------------------------------
// Resource Policy
// ----------------------------------------------------------

export const ResourcePolicySchema = z.object({
  totalBudget: z.number().positive(),
  maxConcurrency: z.number().int().positive().default(5),
  reserveRatio: z.number().min(0).max(1).default(0.1), // Reserve 10% for mutations
  reallocationEnabled: z.boolean().default(true),
});
export type ResourcePolicy = z.infer<typeof ResourcePolicySchema>;

// ----------------------------------------------------------
// Architecture Score
// ----------------------------------------------------------

export const ArchitectureScoreSchema = z.object({
  qualityScore: z.number().min(0).max(1),
  reliabilityScore: z.number().min(0).max(1),
  evidenceScore: z.number().min(0).max(1),
  totalCost: z.number().nonnegative(),
  totalLatencyMs: z.number().int().nonnegative(),
  agentCount: z.number().int().nonnegative(),
  constraintCompliance: z.record(z.string(), z.boolean()).optional(),
});
export type ArchitectureScore = z.infer<typeof ArchitectureScoreSchema>;

// ----------------------------------------------------------
// Architecture
// ----------------------------------------------------------

export const ArchitectureSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  taskId: z.string().min(1),
  runId: z.string().min(1),
  nodes: z.array(AgentNodeSchema).min(1),
  edges: z.array(EdgeSchema).default([]),
  resourcePolicy: ResourcePolicySchema,
  createdAt: z.string().datetime().optional(),
  parentArchitectureId: z.string().nullable().default(null),
  score: ArchitectureScoreSchema.nullable().default(null),
  mutationReason: z.string().nullable().default(null),
});
export type Architecture = z.infer<typeof ArchitectureSchema>;

// ----------------------------------------------------------
// Task
// ----------------------------------------------------------

export const TaskSchema = z.object({
  id: z.string().min(1),
  goal: z.string().min(10),
  budget: z.number().positive(),
  deadlineSeconds: z.number().int().positive(),
  reliabilityTarget: z.number().min(0).max(1),
  availableTools: z.array(z.string()).default([]),
  availableModels: z.array(z.string()).default([]),
  status: z.enum(['CREATED', 'RUNNING', 'COMPLETED', 'FAILED']).default('CREATED'),
  createdAt: z.string().datetime().optional(),
});
export type Task = z.infer<typeof TaskSchema>;

// ----------------------------------------------------------
// Architecture Validation (beyond Zod structural validation)
// ----------------------------------------------------------

/**
 * Validates an architecture beyond structural schema:
 * - No duplicate node IDs
 * - All edge references point to existing nodes
 * - No cycles (DAG requirement)
 */
export function validateArchitecture(arch: Architecture): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const nodeIds = new Set(arch.nodes.map(n => n.id));

  // Check duplicate node IDs
  if (nodeIds.size !== arch.nodes.length) {
    const seen = new Set<string>();
    for (const node of arch.nodes) {
      if (seen.has(node.id)) {
        errors.push(`Duplicate node ID: ${node.id}`);
      }
      seen.add(node.id);
    }
  }

  // Check edge references
  for (const edge of arch.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge references non-existent source node: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge references non-existent target node: ${edge.target}`);
    }
    if (edge.source === edge.target) {
      errors.push(`Self-loop detected on node: ${edge.source}`);
    }
  }

  // Cycle detection via topological sort (Kahn's algorithm)
  if (errors.length === 0) {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const id of nodeIds) {
      inDegree.set(id, 0);
      adjacency.set(id, []);
    }

    for (const edge of arch.edges) {
      adjacency.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    const queue: string[] = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) queue.push(id);
    }

    let processedCount = 0;
    while (queue.length > 0) {
      const current = queue.shift()!;
      processedCount++;
      for (const neighbor of adjacency.get(current)!) {
        const newDegree = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      }
    }

    if (processedCount !== nodeIds.size) {
      errors.push('Architecture contains a cycle — must be a DAG');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Computes topological order of nodes in the architecture.
 * Returns null if the graph contains cycles.
 */
export function topologicalSort(arch: Architecture): string[] | null {
  const nodeIds = new Set(arch.nodes.map(n => n.id));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const id of nodeIds) {
    inDegree.set(id, 0);
    adjacency.set(id, []);
  }

  for (const edge of arch.edges) {
    adjacency.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    for (const neighbor of adjacency.get(current)!) {
      const newDegree = inDegree.get(neighbor)! - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  return order.length === nodeIds.size ? order : null;
}
