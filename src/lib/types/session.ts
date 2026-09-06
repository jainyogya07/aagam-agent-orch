// ============================================================
// Session Types — Agent Resource Exchange
// ============================================================
// Hierarchical session management for orchestrator, architectures, and agents.
// Supports context isolation, persistent memory, and artifact-based communication.
// ============================================================

export type SessionStatus = 
  | 'CREATED' 
  | 'RUNNING' 
  | 'PAUSED' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'CANCELLED';

export type SessionType = 
  | 'TASK'           // Top-level orchestrator session
  | 'ARCHITECTURE'   // Per-architecture iteration session (V1, V2, etc.)
  | 'AGENT';         // Individual agent execution session

// ----------------------------------------------------------
// Base Session Interface
// ----------------------------------------------------------

export interface BaseSession {
  id: string;
  type: SessionType;
  runId: string;
  status: SessionStatus;
  
  // Hierarchy
  parentSessionId: string | null;
  childSessionIds: string[];
  
  // Timing
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  
  // Resources
  budgetUSD: number;
  costUSD: number;
  tokensUsed: number;
  
  // Context
  inputContext: Record<string, unknown>;
  outputContext: Record<string, unknown> | null;
  
  // Artifacts
  inputArtifactIds: string[];
  outputArtifactIds: string[];
  
  // Metadata
  metadata: Record<string, unknown>;
  error: string | null;
}

// ----------------------------------------------------------
// Task Session (Top-Level Orchestrator)
// ----------------------------------------------------------

export interface TaskSession extends BaseSession {
  type: 'TASK';
  taskId: string;
  
  // User Input
  goal: string;
  taskSpec: {
    objective: string;
    domain: string;
    geography: string;
    targetUsers: string[];
    requiredAnalysis: string[];
    constraints: {
      budget: number;
      deadline: number;
      reliability: number;
    };
  };
  
  // Global Decisions
  benchmarkMode: 'BASELINE' | 'RESOURCE_ONLY' | 'FULL';
  availableModels: string[];
  availableTools: string[];
  maxIterations: number;
  
  // Architecture Sessions (V1, V2, V3...)
  architectureSessionIds: string[];
  
  // Final Results
  bestArchitectureSessionId: string | null;
  bestQualityScore: number | null;
  stopReason: string | null;
  finalOutput: string | null;
}

// ----------------------------------------------------------
// Architecture Session (Per Iteration: V1, V2, V3)
// ----------------------------------------------------------

export interface ArchitectureSession extends BaseSession {
  type: 'ARCHITECTURE';
  taskSessionId: string;
  
  // Version Info
  version: number;
  architectureId: string;
  parentArchitectureSessionId: string | null;
  
  // Architecture Details
  nodes: unknown[];  // AgentNode[]
  edges: unknown[];  // Edge[]
  resourcePolicy: unknown;  // ResourcePolicy
  
  // Agent Sessions (children)
  agentSessionIds: string[];
  
  // Mutation Info
  mutationReason: string | null;
  mutationType: string | null;
  expectedImprovement: string | null;
  
  // Evaluation Results
  qualityScore: number | null;
  reliabilityScore: number | null;
  evidenceScore: number | null;
  
  // Resource Tracking
  resourceReservations: ResourceReservation[];
  resourceReclamations: ResourceReclamation[];
}

// ----------------------------------------------------------
// Agent Session (Individual Agent Execution)
// ----------------------------------------------------------

export interface AgentSession extends BaseSession {
  type: 'AGENT';
  taskSessionId: string;
  architectureSessionId: string;
  
  // Agent Identity
  agentNodeId: string;
  agentName: string;
  agentRole: string;
  
  // Execution Config
  model: string;
  systemPrompt: string;
  tools: string[];
  maxTokens: number;
  
  // Resource Budget
  resourceBudget: {
    maxCost: number;
    maxTokens: number;
    maxToolCalls: number;
    maxLatencyMs: number;
  };
  
  // Execution Details
  input: string | null;
  output: string | null;
  toolCalls: ToolCall[];
  
  // Claims & Evidence
  claims: unknown[];  // Claim[]
  evidenceItems: unknown[];  // EvidenceItem[]
  
  // Performance
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  
  // Quality Metrics
  contributionScore: number | null;
  marginalValue: number | null;
  
  // Tracing
  traceId: string | null;
  spanIds: string[];
}

// ----------------------------------------------------------
// Supporting Types
// ----------------------------------------------------------

export interface ResourceReservation {
  agentId: string;
  agentName: string;
  requestedCost: number;
  requestedTokens: number;
  approvedCost: number;
  approvedTokens: number;
  timestamp: Date;
  decision: 'APPROVE' | 'PARTIAL' | 'DEFER' | 'REJECT';
  reason: string;
}

export interface ResourceReclamation {
  agentId: string;
  agentName: string;
  reclaimedCost: number;
  reclaimedTokens: number;
  timestamp: Date;
  reason: string;
  contributionScore: number;
}

export interface ToolCall {
  toolId: string;
  toolName: string;
  input: unknown;
  output: unknown;
  cost: number;
  latencyMs: number;
  success: boolean;
  error: string | null;
  timestamp: Date;
}

// ----------------------------------------------------------
// Session Creation Helpers
// ----------------------------------------------------------

export function createTaskSession(params: {
  runId: string;
  taskId: string;
  goal: string;
  taskSpec: TaskSession['taskSpec'];
  benchmarkMode: TaskSession['benchmarkMode'];
  availableModels: string[];
  availableTools: string[];
  budgetUSD: number;
  maxIterations: number;
}): TaskSession {
  const now = new Date();
  
  return {
    id: `task_session_${params.runId}`,
    type: 'TASK',
    runId: params.runId,
    taskId: params.taskId,
    status: 'CREATED',
    
    parentSessionId: null,
    childSessionIds: [],
    
    createdAt: now,
    startedAt: null,
    completedAt: null,
    
    budgetUSD: params.budgetUSD,
    costUSD: 0,
    tokensUsed: 0,
    
    inputContext: {
      goal: params.goal,
      taskSpec: params.taskSpec,
    },
    outputContext: null,
    
    inputArtifactIds: [],
    outputArtifactIds: [],
    
    metadata: {},
    error: null,
    
    goal: params.goal,
    taskSpec: params.taskSpec,
    benchmarkMode: params.benchmarkMode,
    availableModels: params.availableModels,
    availableTools: params.availableTools,
    maxIterations: params.maxIterations,
    
    architectureSessionIds: [],
    bestArchitectureSessionId: null,
    bestQualityScore: null,
    stopReason: null,
    finalOutput: null,
  };
}

export function createArchitectureSession(params: {
  runId: string;
  taskSessionId: string;
  version: number;
  architectureId: string;
  parentArchitectureSessionId: string | null;
  nodes: unknown[];
  edges: unknown[];
  resourcePolicy: unknown;
  budgetUSD: number;
  mutationReason?: string | null;
  mutationType?: string | null;
}): ArchitectureSession {
  const now = new Date();
  
  return {
    id: `arch_session_${params.runId}_v${params.version}`,
    type: 'ARCHITECTURE',
    runId: params.runId,
    taskSessionId: params.taskSessionId,
    status: 'CREATED',
    
    parentSessionId: params.taskSessionId,
    childSessionIds: [],
    
    createdAt: now,
    startedAt: null,
    completedAt: null,
    
    budgetUSD: params.budgetUSD,
    costUSD: 0,
    tokensUsed: 0,
    
    inputContext: {
      version: params.version,
      architectureId: params.architectureId,
    },
    outputContext: null,
    
    inputArtifactIds: [],
    outputArtifactIds: [],
    
    metadata: {},
    error: null,
    
    version: params.version,
    architectureId: params.architectureId,
    parentArchitectureSessionId: params.parentArchitectureSessionId,
    
    nodes: params.nodes,
    edges: params.edges,
    resourcePolicy: params.resourcePolicy,
    
    agentSessionIds: [],
    
    mutationReason: params.mutationReason ?? null,
    mutationType: params.mutationType ?? null,
    expectedImprovement: null,
    
    qualityScore: null,
    reliabilityScore: null,
    evidenceScore: null,
    
    resourceReservations: [],
    resourceReclamations: [],
  };
}

export function createAgentSession(params: {
  runId: string;
  taskSessionId: string;
  architectureSessionId: string;
  agentNodeId: string;
  agentName: string;
  agentRole: string;
  model: string;
  systemPrompt: string;
  tools: string[];
  resourceBudget: AgentSession['resourceBudget'];
  inputArtifactIds: string[];
}): AgentSession {
  const now = new Date();
  
  return {
    id: `agent_session_${params.runId}_${params.agentNodeId}_${now.getTime()}`,
    type: 'AGENT',
    runId: params.runId,
    taskSessionId: params.taskSessionId,
    architectureSessionId: params.architectureSessionId,
    status: 'CREATED',
    
    parentSessionId: params.architectureSessionId,
    childSessionIds: [],
    
    createdAt: now,
    startedAt: null,
    completedAt: null,
    
    budgetUSD: params.resourceBudget.maxCost,
    costUSD: 0,
    tokensUsed: 0,
    
    inputContext: {
      agentNodeId: params.agentNodeId,
      agentName: params.agentName,
    },
    outputContext: null,
    
    inputArtifactIds: params.inputArtifactIds,
    outputArtifactIds: [],
    
    metadata: {},
    error: null,
    
    agentNodeId: params.agentNodeId,
    agentName: params.agentName,
    agentRole: params.agentRole,
    
    model: params.model,
    systemPrompt: params.systemPrompt,
    tools: params.tools,
    maxTokens: params.resourceBudget.maxTokens,
    
    resourceBudget: params.resourceBudget,
    
    input: null,
    output: null,
    toolCalls: [],
    
    claims: [],
    evidenceItems: [],
    
    tokensIn: 0,
    tokensOut: 0,
    latencyMs: 0,
    
    contributionScore: null,
    marginalValue: null,
    
    traceId: null,
    spanIds: [],
  };
}
