// ============================================================
// Run Store — Agent Resource Exchange
// ============================================================
// Zustand store managing all client-side state for a run.
// Subscribes to SSE events and updates state in real-time.
// ============================================================

import { create } from 'zustand';
import type { SystemEvent } from '@/lib/types/events';

// ----------------------------------------------------------
// Types (client-side mirrors of backend types)
// ----------------------------------------------------------

interface AgentNodeClient {
  id: string;
  name: string;
  role: string;
  objective: string;
  model: string;
  tools: string[];
  resourceBudget: { maxCost: number; maxTokens: number; maxToolCalls: number };
  status: string;
  // Live execution data
  cost?: number;
  tokensIn?: number;
  tokensOut?: number;
  toolCallCount?: number;
  latencyMs?: number;
  contribution?: number;
  output?: string;
}

interface EdgeClient {
  source: string;
  target: string;
  dataContract?: string;
  animated?: boolean;
}

interface ArchitectureVersionClient {
  version: number;
  agents: number;
  cost: number;
  quality: number;
  reliability: number;
  evidence?: number;
  latency: number;
}

interface ResourceState {
  totalBudget: number;
  spent: number;
  remaining: number;
  timeElapsed: number;
  timeDeadline: number;
  allocations: Map<string, { allocated: number; spent: number; name: string }>;
}

interface Reallocation {
  fromAgent: string;
  toAgent: string;
  amount: number;
  reason: string;
  expectedBenefit?: string;
  timestamp: number;
}

interface Reclaim {
  agentName: string;
  amount: number;
  reason: string;
  timestamp: number;
}

interface RunState {
  // Run state
  runId: string | null;
  status: 'idle' | 'running' | 'completed' | 'failed';
  taskGoal: string;
  neatlogsUrl: string | null;
  benchmarkMode: 'BASELINE' | 'RESOURCE_ONLY' | 'FULL';

  // Architecture
  currentVersion: number;
  nodes: AgentNodeClient[];
  edges: EdgeClient[];
  versions: ArchitectureVersionClient[];

  // Resources
  resources: ResourceState;
  reallocations: Reallocation[];
  reclaims: Reclaim[];

  // Events / logs
  events: SystemEvent[];
  logs: Array<{ timestamp: number; level: string; message: string }>;

  // Mutations
  mutations: Array<{
    type: string;
    targetAgent: string;
    reason: string;
    status: string;
    timestamp: number;
  }>;

  // Final results & Quality Gate
  finalQuality: number | null;
  finalReliability: number | null;
  stopReason: string | null;
  qualityGateStatus: 'PASSED' | 'DEFECTS_DETECTED' | null;
  qualityDimensions: Record<string, number> | null;
  repairs: Array<{ round: number; weakestDimension: string; quality: number; timestamp: number }>;
  verifiedClaimsRatio: number | null;

  // Actions
  startRun: (config: {
    goal: string;
    budget: number;
    deadlineSeconds: number;
    reliabilityTarget: number;
    benchmarkMode?: 'BASELINE' | 'RESOURCE_ONLY' | 'FULL';
  }) => Promise<void>;
  startBenchmark: (mode?: 'BASELINE' | 'RESOURCE_ONLY' | 'FULL') => Promise<void>;
  processEvent: (event: SystemEvent) => void;
  reset: () => void;
  connectSSE: (runId: string) => void;
  disconnectSSE: () => void;
}

const initialResourceState: ResourceState = {
  totalBudget: 0,
  spent: 0,
  remaining: 0,
  timeElapsed: 0,
  timeDeadline: 0,
  allocations: new Map(),
};

let eventSource: EventSource | null = null;

export const useRunStore = create<RunState>((set, get) => ({
  runId: null,
  status: 'idle',
  taskGoal: '',
  neatlogsUrl: null,
  benchmarkMode: 'FULL',
  currentVersion: 0,
  nodes: [],
  edges: [],
  versions: [],
  resources: { ...initialResourceState },
  reallocations: [],
  reclaims: [],
  events: [],
  logs: [],
  mutations: [],
  finalQuality: null,
  finalReliability: null,
  stopReason: null,
  qualityGateStatus: null,
  qualityDimensions: null,
  repairs: [],
  verifiedClaimsRatio: null,

  startRun: async (config) => {
    const mode = config.benchmarkMode || 'FULL';
    set({
      status: 'running',
      taskGoal: config.goal,
      neatlogsUrl: null,
      benchmarkMode: mode,
      nodes: [],
      edges: [],
      versions: [],
      events: [],
      logs: [],
      mutations: [],
      reallocations: [],
      reclaims: [],
      currentVersion: 0,
      finalQuality: null,
      finalReliability: null,
      stopReason: null,
      qualityGateStatus: null,
      qualityDimensions: null,
      repairs: [],
      verifiedClaimsRatio: null,
      resources: {
        totalBudget: config.budget,
        spent: 0,
        remaining: config.budget,
        timeElapsed: 0,
        timeDeadline: config.deadlineSeconds,
        allocations: new Map(),
      },
    });

    // Add initial log
    get().logs.push({
      timestamp: Date.now(),
      level: 'info',
      message: `Initializing run [${mode}]: "${config.goal}"`,
    });

    try {
      const response = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: config.goal,
          budget: config.budget,
          deadlineSeconds: config.deadlineSeconds,
          reliabilityTarget: config.reliabilityTarget,
          benchmarkMode: mode,
          async: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Run failed to start');
      }

      set({
        runId: data.runId,
        neatlogsUrl: data.neatlogsUrl || null,
        status: 'running',
      });

      // Stream events live via SSE
      get().connectSSE(data.runId);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ status: 'failed', stopReason: message });
      get().logs.push({ timestamp: Date.now(), level: 'error', message });
    }
  },

  startBenchmark: async (mode = 'FULL') => {
    const benchmarkTask = {
      goal: 'Determine whether this startup idea is commercially viable. Identify competitors, estimate market opportunity, identify key risks, validate important claims, and produce a recommendation.',
      budget: 0.50,
      deadlineSeconds: 60,
      reliabilityTarget: 0.90,
    };

    set({
      status: 'running',
      taskGoal: benchmarkTask.goal,
      neatlogsUrl: null,
      benchmarkMode: mode,
      nodes: [],
      edges: [],
      versions: [],
      events: [],
      logs: [],
      mutations: [],
      reallocations: [],
      reclaims: [],
      currentVersion: 0,
      finalQuality: null,
      finalReliability: null,
      stopReason: null,
      qualityGateStatus: null,
      qualityDimensions: null,
      repairs: [],
      verifiedClaimsRatio: null,
      resources: {
        totalBudget: benchmarkTask.budget,
        spent: 0,
        remaining: benchmarkTask.budget,
        timeElapsed: 0,
        timeDeadline: benchmarkTask.deadlineSeconds,
        allocations: new Map(),
      },
    });

    get().logs.push({
      timestamp: Date.now(),
      level: 'info',
      message: `Starting Deterministic Benchmark [Mode: ${mode}] — Testing Resource Exchange & Architecture Mutation`,
    });

    try {
      const response = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          async: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Benchmark failed to start');
      }

      set({
        runId: data.runId,
        neatlogsUrl: data.neatlogsUrl || null,
        status: 'running',
      });

      get().connectSSE(data.runId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ status: 'failed', stopReason: message });
      get().logs.push({ timestamp: Date.now(), level: 'error', message });
    }
  },

  processEvent: (event: SystemEvent) => {
    const state = get();

    // Add to events array
    set({ events: [...state.events, event] });

    // Process by event type
    switch (event.type) {
      case 'log.info':
      case 'log.warn':
      case 'log.error':
        set({
          logs: [...state.logs, {
            timestamp: event.timestamp,
            level: event.type.split('.')[1],
            message: String(event.payload.message || ''),
          }],
        });
        break;

      case 'architecture.created':
      case 'architecture.updated': {
        const p = event.payload;
        const agents = (p.agents as Array<{
          id: string;
          name: string;
          role: string;
          objective?: string;
          model: string;
          tools?: string[];
          resourceBudget?: { maxCost: number; maxTokens: number; maxToolCalls: number };
        }>) || [];
        const edges = (p.edges as Array<{ source: string; target: string; dataContract?: string }>) || [];

        if (agents.length > 0) {
          set({
            currentVersion: Number(p.newVersion || p.version || 1),
            nodes: agents.map(a => ({
              id: a.id,
              name: a.name,
              role: a.role,
              objective: a.objective || '',
              model: a.model,
              tools: a.tools || [],
              resourceBudget: a.resourceBudget || { maxCost: 0, maxTokens: 0, maxToolCalls: 0 },
              status: 'PENDING',
            })),
            edges: edges.map(e => ({
              source: e.source,
              target: e.target,
              dataContract: e.dataContract,
              animated: false,
            })),
          });
        }
        break;
      }

      case 'agent.started': {
        const p = event.payload;
        set({
          nodes: state.nodes.map(n =>
            n.id === p.agentId ? { ...n, status: 'RUNNING' } : n
          ),
          edges: state.edges.map(e =>
            e.target === String(p.agentId) ? { ...e, animated: true } : e
          ),
        });
        break;
      }

      case 'agent.completed': {
        const p = event.payload;
        set({
          nodes: state.nodes.map(n =>
            n.id === p.agentId ? {
              ...n,
              status: 'COMPLETED',
              cost: Number(p.cost) || 0,
              tokensIn: Number(p.tokensIn) || 0,
              tokensOut: Number(p.tokensOut) || 0,
              latencyMs: Number(p.latencyMs) || 0,
              toolCallCount: Number(p.toolCalls) || 0,
            } : n
          ),
          edges: state.edges.map(e =>
            e.target === String(p.agentId) ? { ...e, animated: false } : e
          ),
          resources: {
            ...state.resources,
            spent: state.resources.spent + (Number(p.cost) || 0),
            remaining: state.resources.remaining - (Number(p.cost) || 0),
          },
        });
        break;
      }

      case 'agent.failed': {
        const p = event.payload;
        set({
          nodes: state.nodes.map(n =>
            n.id === p.agentId ? { ...n, status: 'FAILED' } : n
          ),
        });
        break;
      }

      case 'resource.reclaimed': {
        const p = event.payload;
        set({
          reclaims: [...state.reclaims, {
            agentName: String(p.fromAgentName || p.agentName || 'Agent'),
            amount: Number(p.amount) || 0,
            reason: String(p.reason || ''),
            timestamp: event.timestamp,
          }],
        });
        break;
      }

      case 'resource.reallocated': {
        const p = event.payload;
        set({
          reallocations: [...state.reallocations, {
            fromAgent: String(p.fromAgentName || ''),
            toAgent: String(p.toAgentName || ''),
            amount: Number(p.amount) || 0,
            reason: String(p.reason || ''),
            expectedBenefit: p.expectedOutcomeGain ? `+${(Number(p.expectedOutcomeGain) * 100).toFixed(1)}% expected outcome gain` : undefined,
            timestamp: event.timestamp,
          }],
        });
        break;
      }

      case 'contribution.analyzed': {
        const contributions = (event.payload.contributions as Array<{
          agentId: string;
          marginalQualityGain: number;
        }>) || [];
        set({
          nodes: state.nodes.map(n => {
            const contrib = contributions.find(c => c.agentId === n.id);
            return contrib ? { ...n, contribution: contrib.marginalQualityGain } : n;
          }),
        });
        break;
      }

      case 'mutation.proposed':
        set({
          mutations: [...state.mutations, {
            type: String(event.payload.type || ''),
            targetAgent: String(event.payload.targetNodeId || ''),
            reason: String(event.payload.reason || ''),
            status: 'PROPOSED',
            timestamp: event.timestamp,
          }],
        });
        break;

      case 'mutation.accepted':
        set({
          mutations: state.mutations.map(m =>
            m.timestamp === event.timestamp ? { ...m, status: 'ACCEPTED' } : m
          ),
        });
        break;

      case 'mutation.rejected':
        set({
          mutations: state.mutations.map(m =>
            m.timestamp === event.timestamp ? { ...m, status: 'REJECTED' } : m
          ),
        });
        break;

      case 'quality.gate.evaluated': {
        const p = event.payload;
        set({
          qualityGateStatus: p.passed ? 'PASSED' : 'DEFECTS_DETECTED',
          qualityDimensions: (p.dimensions as Record<string, number>) || null,
          finalQuality: Number(p.overallScore) || get().finalQuality,
        });
        break;
      }

      case 'repair.started': {
        const p = event.payload;
        set({
          repairs: [...state.repairs, {
            round: Number(p.round) || 1,
            weakestDimension: String(p.weakestDimension || 'evidence'),
            quality: Number(p.currentQuality) || 0,
            timestamp: event.timestamp,
          }],
        });
        break;
      }

      case 'claim.verified': {
        const p = event.payload;
        set({
          verifiedClaimsRatio: Number(p.criticalVerificationRatio) || 1.0,
        });
        break;
      }

      case 'evaluation.completed': {
        const p = event.payload;
        set({
          finalQuality: Number(p.qualityScore) || null,
          finalReliability: Number(p.reliabilityScore) || null,
        });
        break;
      }

      case 'run.completed': {
        const p = event.payload;
        set({
          status: 'completed',
          stopReason: String(p.stopReason || ''),
          finalQuality: p.qualityScore !== undefined ? Number(p.qualityScore) : get().finalQuality,
          finalReliability: p.reliabilityScore !== undefined ? Number(p.reliabilityScore) : get().finalReliability,
        });
        break;
      }

      case 'run.failed':
        set({ status: 'failed' });
        break;

      case 'architecture.compared': {
        const versions = (event.payload.versions as ArchitectureVersionClient[]) || [];
        set({ versions });
        break;
      }
    }
  },

  connectSSE: (runId: string) => {
    if (eventSource) eventSource.close();

    eventSource = new EventSource(`/api/events/${runId}`);
    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as SystemEvent;
        get().processEvent(event);
      } catch {
        // Ignore malformed events
      }
    };
    eventSource.onerror = () => {
      // SSE connection error — will auto-reconnect
    };
  },

  disconnectSSE: () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  },

  reset: () => {
    if (eventSource) eventSource.close();
    set({
      runId: null,
      status: 'idle',
      taskGoal: '',
      currentVersion: 0,
      nodes: [],
      edges: [],
      versions: [],
      resources: { ...initialResourceState },
      reallocations: [],
      events: [],
      logs: [],
      mutations: [],
      finalQuality: null,
      finalReliability: null,
      stopReason: null,
      qualityGateStatus: null,
      qualityDimensions: null,
      repairs: [],
      verifiedClaimsRatio: null,
    });
  },
}));
