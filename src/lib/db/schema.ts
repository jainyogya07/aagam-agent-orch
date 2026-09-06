// ============================================================
// Database Schema — Agent Resource Exchange
// ============================================================
// PostgreSQL via Drizzle ORM.
// Relational tables for operational data, JSONB for architecture snapshots.
// ============================================================

import {
  pgTable,
  text,
  timestamp,
  real,
  integer,
  jsonb,
  pgEnum,
  uuid,
  boolean,
} from 'drizzle-orm/pg-core';

// ----------------------------------------------------------
// Enums
// ----------------------------------------------------------

export const taskStatusEnum = pgEnum('task_status', [
  'CREATED', 'RUNNING', 'COMPLETED', 'FAILED',
]);

export const runStatusEnum = pgEnum('run_status', [
  'CREATED', 'RUNNING', 'EVALUATING', 'MUTATING', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT',
]);

export const agentStatusEnum = pgEnum('agent_status', [
  'PENDING', 'READY', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'BLOCKED',
]);

export const resourceEventTypeEnum = pgEnum('resource_event_type', [
  'REQUEST', 'APPROVE', 'PARTIAL', 'DEFER', 'REJECT', 'RECLAIM',
]);

export const mutationTypeEnum = pgEnum('mutation_type', [
  'ADD_AGENT', 'REMOVE_AGENT', 'REWIRE', 'CHANGE_MODEL', 'CHANGE_TOOL',
  'CHANGE_RESOURCE_ALLOCATION', 'CHANGE_EXECUTION_POLICY',
]);

export const mutationStatusEnum = pgEnum('mutation_status', [
  'PROPOSED', 'ACCEPTED', 'REJECTED',
]);

// ----------------------------------------------------------
// Tasks
// ----------------------------------------------------------

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  goal: text('goal').notNull(),
  budget: real('budget').notNull(),
  deadlineSeconds: integer('deadline_seconds').notNull(),
  reliabilityTarget: real('reliability_target').notNull(),
  availableTools: jsonb('available_tools').$type<string[]>().default([]),
  availableModels: jsonb('available_models').$type<string[]>().default([]),
  status: taskStatusEnum('status').notNull().default('CREATED'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ----------------------------------------------------------
// Runs
// ----------------------------------------------------------

export const runs = pgTable('runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id),
  status: runStatusEnum('status').notNull().default('CREATED'),
  currentArchitectureVersion: integer('current_architecture_version').default(0),
  bestArchitectureId: uuid('best_architecture_id'),
  maxIterations: integer('max_iterations').default(5),
  currentIteration: integer('current_iteration').default(0),
  stopReason: text('stop_reason'),
  finalOutput: text('final_output'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ----------------------------------------------------------
// Architectures (immutable versioned snapshots)
// ----------------------------------------------------------

export const architectures = pgTable('architectures', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => runs.id),
  version: integer('version').notNull(),
  parentId: uuid('parent_id'),
  nodes: jsonb('nodes').notNull(), // AgentNode[]
  edges: jsonb('edges').notNull(), // Edge[]
  resourcePolicy: jsonb('resource_policy').notNull(), // ResourcePolicy
  score: jsonb('score'), // ArchitectureScore | null
  mutationReason: text('mutation_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ----------------------------------------------------------
// Executions (one per agent per architecture run)
// ----------------------------------------------------------

export const executions = pgTable('executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => runs.id),
  architectureId: uuid('architecture_id').notNull().references(() => architectures.id),
  agentNodeId: text('agent_node_id').notNull(),
  agentName: text('agent_name').notNull(),
  model: text('model').notNull(),
  status: agentStatusEnum('status').notNull().default('PENDING'),
  input: text('input'),
  output: text('output'),
  tokensIn: integer('tokens_in').default(0),
  tokensOut: integer('tokens_out').default(0),
  cost: real('cost').default(0),
  latencyMs: integer('latency_ms').default(0),
  toolCalls: jsonb('tool_calls').$type<unknown[]>().default([]),
  traceId: text('trace_id'),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ----------------------------------------------------------
// Resource Events
// ----------------------------------------------------------

export const resourceEvents = pgTable('resource_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => runs.id),
  architectureId: uuid('architecture_id').notNull().references(() => architectures.id),
  agentNodeId: text('agent_node_id').notNull(),
  eventType: resourceEventTypeEnum('event_type').notNull(),
  requested: jsonb('requested'), // ResourceRequest
  approved: jsonb('approved'), // Partial<ResourceRequest>
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ----------------------------------------------------------
// Evaluations
// ----------------------------------------------------------

export const evaluations = pgTable('evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => runs.id),
  architectureId: uuid('architecture_id').notNull().references(() => architectures.id),
  qualityScore: real('quality_score'),
  reliabilityScore: real('reliability_score'),
  evidenceScore: real('evidence_score'),
  constraintCompliance: jsonb('constraint_compliance'),
  failureReasons: jsonb('failure_reasons').$type<string[]>().default([]),
  evaluationMethod: text('evaluation_method'),
  rawResponse: text('raw_response'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ----------------------------------------------------------
// Mutations
// ----------------------------------------------------------

export const mutations = pgTable('mutations', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => runs.id),
  sourceArchitectureId: uuid('source_architecture_id').notNull().references(() => architectures.id),
  targetArchitectureId: uuid('target_architecture_id').references(() => architectures.id),
  mutationType: mutationTypeEnum('mutation_type').notNull(),
  targetNodeId: text('target_node_id'),
  reason: text('reason').notNull(),
  expectedImprovement: text('expected_improvement'),
  risk: text('risk'),
  status: mutationStatusEnum('status').notNull().default('PROPOSED'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ----------------------------------------------------------
// Sessions (hierarchical: Task → Architecture → Agent)
// ----------------------------------------------------------

export const sessionTypeEnum = pgEnum('session_type', [
  'TASK', 'ARCHITECTURE', 'AGENT',
]);

export const sessionStatusEnum = pgEnum('session_status', [
  'CREATED', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED',
]);

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: sessionTypeEnum('type').notNull(),
  runId: uuid('run_id').notNull().references(() => runs.id),
  
  // Hierarchy
  parentSessionId: uuid('parent_session_id'),
  childSessionIds: jsonb('child_session_ids').$type<string[]>().default([]),
  
  // Task Session specific
  taskId: uuid('task_id').references(() => tasks.id),
  goal: text('goal'),
  taskSpec: jsonb('task_spec'),
  benchmarkMode: text('benchmark_mode'),
  availableModels: jsonb('available_models').$type<string[]>(),
  availableTools: jsonb('available_tools').$type<string[]>(),
  maxIterations: integer('max_iterations'),
  architectureSessionIds: jsonb('architecture_session_ids').$type<string[]>().default([]),
  bestArchitectureSessionId: uuid('best_architecture_session_id'),
  bestQualityScore: real('best_quality_score'),
  stopReason: text('stop_reason'),
  finalOutput: text('final_output'),
  
  // Architecture Session specific
  taskSessionId: uuid('task_session_id'),
  version: integer('version'),
  architectureId: uuid('architecture_id').references(() => architectures.id),
  parentArchitectureSessionId: uuid('parent_architecture_session_id'),
  nodes: jsonb('nodes'),
  edges: jsonb('edges'),
  resourcePolicy: jsonb('resource_policy'),
  agentSessionIds: jsonb('agent_session_ids').$type<string[]>().default([]),
  mutationReason: text('mutation_reason'),
  mutationType: text('mutation_type'),
  expectedImprovement: text('expected_improvement'),
  qualityScore: real('quality_score'),
  reliabilityScore: real('reliability_score'),
  evidenceScore: real('evidence_score'),
  resourceReservations: jsonb('resource_reservations').$type<unknown[]>().default([]),
  resourceReclamations: jsonb('resource_reclamations').$type<unknown[]>().default([]),
  
  // Agent Session specific
  architectureSessionId: uuid('architecture_session_id'),
  agentNodeId: text('agent_node_id'),
  agentName: text('agent_name'),
  agentRole: text('agent_role'),
  model: text('model'),
  systemPrompt: text('system_prompt'),
  tools: jsonb('tools').$type<string[]>(),
  maxTokens: integer('max_tokens'),
  resourceBudget: jsonb('resource_budget'),
  input: text('input'),
  output: text('output'),
  toolCalls: jsonb('tool_calls').$type<unknown[]>().default([]),
  claims: jsonb('claims').$type<unknown[]>().default([]),
  evidenceItems: jsonb('evidence_items').$type<unknown[]>().default([]),
  tokensIn: integer('tokens_in').default(0),
  tokensOut: integer('tokens_out').default(0),
  latencyMs: integer('latency_ms').default(0),
  contributionScore: real('contribution_score'),
  marginalValue: real('marginal_value'),
  traceId: text('trace_id'),
  spanIds: jsonb('span_ids').$type<string[]>().default([]),
  
  // Common fields
  status: sessionStatusEnum('status').notNull().default('CREATED'),
  budgetUSD: real('budget_usd').notNull(),
  costUSD: real('cost_usd').default(0),
  tokensUsed: integer('tokens_used').default(0),
  inputContext: jsonb('input_context').notNull(),
  outputContext: jsonb('output_context'),
  inputArtifactIds: jsonb('input_artifact_ids').$type<string[]>().default([]),
  outputArtifactIds: jsonb('output_artifact_ids').$type<string[]>().default([]),
  metadata: jsonb('metadata').default({}),
  error: text('error'),
  
  // Timestamps
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ----------------------------------------------------------
// Events (for SSE streaming and audit trail)
// ----------------------------------------------------------

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => runs.id),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
