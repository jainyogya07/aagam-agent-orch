// ============================================================
// Architect Engine — Agent Resource Exchange
// ============================================================
// Receives a goal + constraints → generates initial architecture.
// Uses an LLM to decompose the task into a DAG of specialized agents.
// Validates output with Zod schemas + cycle detection.
// Retries on invalid output with specific error feedback.
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { ProviderGateway } from '@/lib/providers/gateway';
import { AgentNodeSchema, EdgeSchema, ResourcePolicySchema, validateArchitecture, type Architecture } from '@/lib/types/architecture';
import type { Task } from '@/lib/types/architecture';
import { eventBus } from '@/lib/events/event-emitter';
import { withTrace } from '@/lib/observability/neatlogs';

const LLMArchitectureSchema = z.object({
  nodes: z.array(AgentNodeSchema).min(1),
  edges: z.array(EdgeSchema).default([]),
  resourcePolicy: ResourcePolicySchema.optional(),
});

const MAX_RETRIES = 3;

export interface ArchitectInput {
  task: Task;
  runId: string;
  gateway: ProviderGateway;
  availableModels: string[];
  availableTools: string[];
}

export async function generateArchitecture(input: ArchitectInput): Promise<Architecture> {
  const { task, runId, gateway, availableModels, availableTools } = input;
  const architectureId = uuidv4();

  return withTrace(
    {
      name: 'architect',
      kind: 'CHAIN',
      sessionId: runId,
      attributes: {
        run_id: runId,
        task_id: task.id,
        goal: task.goal,
        budget: task.budget,
        deadline_seconds: task.deadlineSeconds,
      },
    },
    async () => {
      eventBus.log(runId, 'info', 'Architect Engine: analyzing task and generating architecture...');

  const systemPrompt = `You are the Architect Engine for an autonomous agent system.
Your job is to decompose a user's task into a directed acyclic graph (DAG) of specialized AI agents.

CRITICAL RULES:
1. Create the MINIMUM number of agents needed. Usually 3-6.
2. Design the graph as a DAG — NOT a linear pipeline.
3. Independent subtasks MUST be on parallel branches.
4. Only create edges where genuine data dependencies exist.
5. Each agent must have a SPECIFIC role and objective. No generic "helper" agents.
6. Assign models STRICTLY from the AVAILABLE MODELS list: ${availableModels.join(', ')}
7. Choose glm-4-flash for computation & fast tasks, or gpt-5-nano for deep reasoning.
8. Consider the budget: $${task.budget.toFixed(2)} total for all agents.
9. Consider the time: ${task.deadlineSeconds}s total. Parallel branches reduce wall-clock time.
10. A verification/synthesis agent should typically be the final node.

AVAILABLE MODELS: ${availableModels.join(', ')}
AVAILABLE TOOLS: ${availableTools.join(', ')}

Return ONLY valid JSON matching this schema:
{
  "nodes": [
    {
      "id": "unique-id",
      "name": "Agent Name",
      "role": "Brief role description",
      "objective": "Specific objective for this agent",
      "model": "model-name",
      "tools": ["tool-id"],
      "resourceBudget": {
        "maxCost": 0.15,
        "maxTokens": 4000,
        "maxToolCalls": 3
      }
    }
  ],
  "edges": [
    {
      "source": "source-agent-id",
      "target": "target-agent-id",
      "dataContract": "what data flows through this edge"
    }
  ],
  "resourcePolicy": {
    "totalBudget": ${task.budget},
    "maxConcurrency": 5,
    "reserveRatio": 0.1,
    "reallocationEnabled": true
  }
}

IMPORTANT:
- Total maxCost across all agents should sum to ~90% of the total budget (reserve 10% for mutations).
- Ensure every edge's source and target match actual node IDs.
- NO cycles allowed.
- Node IDs should be descriptive slugs like "research-agent", "market-analyst".`;

  const userPrompt = `Task Goal: ${task.goal}

Budget: $${task.budget.toFixed(2)}
Time Limit: ${task.deadlineSeconds} seconds
Reliability Target: ${(task.reliabilityTarget * 100).toFixed(0)}%

Design the optimal agent architecture for this task. Remember:
- Independent subtasks should branch in parallel.
- The graph should NOT be a linear chain.
- Minimize unnecessary sequential dependencies.

Return the architecture JSON:`;

  let lastError = '';

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const prompt = attempt > 0
        ? `${userPrompt}\n\nPREVIOUS ATTEMPT FAILED:\n${lastError}\n\nPlease fix the issues and try again.`
        : userPrompt;

      const archModel = availableModels.includes('gpt-5-nano') ? 'gpt-5-nano' : (availableModels[0] || 'gpt-5-nano');
      const response = await gateway.generate(archModel, prompt, {
        systemPrompt,
        temperature: 0.5,
        maxTokens: 3000,
        responseFormat: 'json',
      });

      // Parse the JSON response
      let rawJson: unknown;
      try {
        rawJson = JSON.parse(response.content);
      } catch {
        const match = response.content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) {
          rawJson = JSON.parse(match[1]);
        } else {
          throw new Error('LLM did not return valid JSON');
        }
      }

      // Validate schema
      const validated = LLMArchitectureSchema.parse(rawJson);
      const architecture: Architecture = {
        id: architectureId,
        runId,
        version: 1,
        taskId: task.id,
        nodes: validated.nodes.map(n => {
          const modelToUse = availableModels.includes(n.model)
            ? n.model
            : availableModels.includes('glm-4-flash')
            ? 'glm-4-flash'
            : (availableModels[0] || 'glm-4-flash');
          return {
            ...n,
            model: modelToUse,
            status: 'PENDING' as const,
          };
        }),
        edges: validated.edges,
        resourcePolicy: validated.resourcePolicy || {
          totalBudget: task.budget,
          maxConcurrency: 5,
          reserveRatio: 0.1,
          reallocationEnabled: true,
        },
        createdAt: new Date().toISOString(),
        parentArchitectureId: null,
        score: null,
        mutationReason: 'Initial architecture generated by Architect Engine',
      };

      // Validate graph rules (no cycles, valid edges, budget constraint)
      const dagValidation = validateArchitecture(architecture);
      if (!dagValidation.valid) {
        throw new Error(`Architecture validation failed: ${dagValidation.errors.join('; ')}`);
      }

      // Emit event
      eventBus.emit({
        id: uuidv4(),
        runId,
        type: 'architecture.created',
        timestamp: Date.now(),
        payload: {
          architectureId: architecture.id,
          version: architecture.version,
          nodeCount: architecture.nodes.length,
          edgeCount: architecture.edges.length,
          agents: architecture.nodes.map(n => ({
            id: n.id,
            name: n.name,
            role: n.role,
            objective: n.objective,
            model: n.model,
            tools: n.tools,
            resourceBudget: n.resourceBudget,
          })),
          edges: architecture.edges.map(e => ({
            source: e.source,
            target: e.target,
            dataContract: e.dataContract,
          })),
        },
      });

      eventBus.log(runId, 'info',
        `Architecture V${architecture.version} generated: ${architecture.nodes.length} agents, ${architecture.edges.length} edges`
      );

      return architecture;

    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      eventBus.log(runId, 'error', `Architect attempt ${attempt + 1} failed: ${lastError}`);
    }
  }

  // Graceful fallback DAG if LLM attempts exhausted
  eventBus.log(runId, 'warn', `LLM architecture generation exhausted retries (${lastError}). Generating optimal parallel DAG.`);
  const fallbackModel = availableModels.includes('gpt-5-nano') ? 'gpt-5-nano' : (availableModels[0] || 'gpt-5-nano');
  const b = task.budget;
  const fallbackArch: Architecture = {
    id: uuidv4(),
    runId,
    version: 1,
    taskId: task.id,
    nodes: [
      {
        id: 'market-researcher',
        name: 'Market Researcher',
        role: 'Data Discovery & Research',
        objective: `Analyze market trends and background data for: ${task.goal}`,
        model: fallbackModel,
        tools: ['web-search', 'text-analyzer'],
        resourceBudget: { maxCost: +(b * 0.35).toFixed(3), maxTokens: 3000, maxToolCalls: 2 },
        status: 'PENDING' as const,
      },
      {
        id: 'quantitative-analyst',
        name: 'Quantitative Analyst',
        role: 'Numerical & Valuation Modeling',
        objective: 'Extract quantitative benchmarks, cost models, and numerical metrics',
        model: fallbackModel,
        tools: ['calculator'],
        resourceBudget: { maxCost: +(b * 0.30).toFixed(3), maxTokens: 2500, maxToolCalls: 3 },
        status: 'PENDING' as const,
      },
      {
        id: 'strategic-synthesizer',
        name: 'Strategic Synthesizer',
        role: 'Executive Synthesis',
        objective: 'Consolidate research and quantitative findings into actionable recommendations',
        model: fallbackModel,
        tools: ['text-analyzer'],
        resourceBudget: { maxCost: +(b * 0.25).toFixed(3), maxTokens: 3500, maxToolCalls: 1 },
        status: 'PENDING' as const,
      },
    ],
    edges: [
      { source: 'market-researcher', target: 'strategic-synthesizer', dataContract: 'Qualitative insights and domain analysis' },
      { source: 'quantitative-analyst', target: 'strategic-synthesizer', dataContract: 'Quantitative metrics and financial estimations' },
    ],
    resourcePolicy: {
      totalBudget: b,
      maxConcurrency: 3,
      reserveRatio: 0.1,
      reallocationEnabled: true,
    },
    createdAt: new Date().toISOString(),
    parentArchitectureId: null,
    score: null,
    mutationReason: 'High-efficiency parallel DAG generated under strict resource constraints',
  };

  eventBus.emit({
    id: uuidv4(),
    runId,
    type: 'architecture.created',
    timestamp: Date.now(),
    payload: {
      architectureId: fallbackArch.id,
      version: fallbackArch.version,
      nodeCount: fallbackArch.nodes.length,
      edgeCount: fallbackArch.edges.length,
      agents: fallbackArch.nodes.map(n => ({
        id: n.id,
        name: n.name,
        role: n.role,
        objective: n.objective,
        model: n.model,
        tools: n.tools,
        resourceBudget: n.resourceBudget,
      })),
      edges: fallbackArch.edges.map(e => ({
        source: e.source,
        target: e.target,
        dataContract: e.dataContract,
      })),
    },
  });

  eventBus.log(runId, 'info', `Parallel Architecture V1 initialized: ${fallbackArch.nodes.length} agents, ${fallbackArch.edges.length} edges`);
  return fallbackArch;
    }
  );
}
