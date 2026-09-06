// ============================================================
// Agent Runner — Agent Resource Exchange
// ============================================================
// Refactored behind the AgentRuntime interface.
// Delegates execution to OpenAIAgentRuntime (or DeterministicAgentRuntime),
// preserving Neatlogs trace correlation, event bus emissions,
// and backward-compatible AgentRunnerInput signatures.
// ============================================================

import { ProviderGateway } from '@/lib/providers/gateway';
import type { AgentNode } from '@/lib/types/architecture';
import type { AgentExecutionResult } from '@/lib/types/evaluation';
import type { ArtifactEnvelope } from '@/lib/types/artifacts';
import { OpenAIAgentRuntime } from '@/lib/runtime/agent-runtime';
import { withTrace } from '@/lib/observability/neatlogs';

export interface AgentRunnerInput {
  agent: AgentNode;
  inputs: Record<string, string>; // Outputs from upstream agents: { [agentName]: output }
  taskGoal: string;
  runId: string;
  architectureId: string;
  architectureVersion?: number;
  taskId?: string;
  upstreamArtifacts?: ArtifactEnvelope[];
  gateway: ProviderGateway;
  availableBudgetUSD?: number;
  remainingTimeMs?: number;
  signal?: AbortSignal;
}

const defaultRuntime = new OpenAIAgentRuntime();

export async function runAgent(input: AgentRunnerInput): Promise<AgentExecutionResult> {
  const {
    agent,
    inputs,
    taskGoal,
    runId,
    architectureId,
    architectureVersion = 1,
    taskId = runId,
    upstreamArtifacts = [],
    gateway,
    availableBudgetUSD = agent.resourceBudget.maxCost > 0 ? agent.resourceBudget.maxCost : 0.10,
    remainingTimeMs = 30000,
    signal,
  } = input;

  return withTrace(
    {
      name: `agent:${agent.name}`,
      kind: 'AGENT',
      sessionId: runId,
      attributes: {
        run_id: runId,
        architecture_id: architectureId,
        architecture_version: architectureVersion,
        agent_id: agent.id,
        agent_name: agent.name,
        agent_role: agent.role,
        model: agent.model,
        budget_cost: agent.resourceBudget.maxCost,
        budget_tokens: agent.resourceBudget.maxTokens,
        tools_requested: agent.tools.join(','),
      },
    },
    async () => {
      return defaultRuntime.executeAgent({
        agent,
        taskGoal,
        runId,
        architectureId,
        architectureVersion,
        taskId,
        upstreamArtifacts,
        upstreamInputs: inputs,
        availableBudgetUSD,
        remainingTimeMs,
        gateway,
        signal,
      });
    }
  );
}
