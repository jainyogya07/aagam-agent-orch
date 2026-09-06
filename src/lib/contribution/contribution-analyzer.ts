// ============================================================
// Contribution Analyzer — Agent Resource Exchange
// ============================================================
// Estimates each agent's marginal contribution to the outcome.
// Uses measurable signals — NOT self-reported confidence.
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { ProviderGateway } from '@/lib/providers/gateway';
import { eventBus } from '@/lib/events/event-emitter';
import type { AgentContribution, AgentExecutionResult } from '@/lib/types/evaluation';

import { withTrace } from '@/lib/observability/neatlogs';

export interface ContributionAnalyzerInput {
  runId: string;
  architectureId: string;
  agentResults: Map<string, AgentExecutionResult>;
  gateway: ProviderGateway;
  taskGoal: string;
}

export async function analyzeContributions(
  input: ContributionAnalyzerInput
): Promise<AgentContribution[]> {
  const { runId, architectureId, agentResults, gateway, taskGoal } = input;

  return withTrace(
    {
      name: 'contribution-analysis',
      kind: 'EVALUATOR',
      sessionId: runId,
      attributes: {
        run_id: runId,
        architecture_id: architectureId,
        agent_count: agentResults.size,
      },
    },
    async () => {
      eventBus.log(runId, 'info', 'Analyzing agent contributions...');

  // Build the analysis prompt
  const agentSummaries = [...agentResults.entries()].map(([id, result]) => ({
    id,
    name: result.agentName,
    status: result.status,
    outputLength: result.output.length,
    evidenceCount: result.evidence.length,
    cost: result.cost,
    latencyMs: result.latencyMs,
    tokens: result.totalTokens,
    outputPreview: result.output.substring(0, 500),
  }));

  const systemPrompt = `You are a contribution analyzer for an autonomous agent system.
Your job is to estimate how much each agent contributed to the overall outcome.

RULES:
- Base your analysis on MEASURABLE signals: output content, evidence introduced, unique insights.
- Do NOT simply trust agent self-assessment.
- Look for REDUNDANCY: Did two agents produce similar information?
- Look for UNIQUE VALUE: What did only this agent bring?
- Score marginal_quality_gain from -0.1 (harmful) to 0.3 (very high value).
- Score redundancy_ratio from 0 (all unique) to 1 (fully redundant).
- Score confidence from 0 to 1 (your confidence in this assessment).

Return a JSON array:
[
  {
    "agentId": "...",
    "marginalQualityGain": 0.0-0.3,
    "reliabilityGain": 0.0-0.2,
    "evidenceGain": 0.0-0.2,
    "uniqueInsights": 0-10,
    "redundancyRatio": 0.0-1.0,
    "confidence": 0.0-1.0,
    "reasoning": "brief explanation"
  }
]`;

  const userPrompt = `## Task Goal
${taskGoal}

## Agent Results
${agentSummaries.map(a => `
### ${a.name} (${a.id})
- Status: ${a.status}
- Cost: $${a.cost.toFixed(4)}
- Tokens: ${a.tokens}
- Latency: ${a.latencyMs}ms
- Evidence items: ${a.evidenceCount}
- Output preview:
${a.outputPreview}
`).join('\n---\n')}

Analyze each agent's marginal contribution. Return JSON array:`;

  try {
    const availableModels = gateway.getAvailableModels();
    const contribModel = availableModels.includes('glm-4-flash')
      ? 'glm-4-flash'
      : availableModels.includes('gpt-5-nano')
      ? 'gpt-5-nano'
      : (availableModels[0] || 'glm-4-flash');
    const response = await gateway.generate(contribModel, userPrompt, {
      systemPrompt,
      temperature: 0.3,
      maxTokens: 2000,
      responseFormat: 'json',
    });

    const parsed = JSON.parse(response.content);
    const rawContributions = Array.isArray(parsed) ? parsed : parsed.contributions || [];

    const contributions: AgentContribution[] = rawContributions.map((raw: Record<string, unknown>) => {
      const agentId = String(raw.agentId || '');
      const result = agentResults.get(agentId);
      const marginalQualityGain = clamp(Number(raw.marginalQualityGain) || 0, -0.1, 0.5);
      const cost = result?.cost ?? 0;

      return {
        agentId,
        agentName: result?.agentName ?? agentId,
        marginalQualityGain,
        reliabilityGain: clamp(Number(raw.reliabilityGain) || 0, -0.1, 0.3),
        cost,
        latencyMs: result?.latencyMs ?? 0,
        evidenceGain: clamp(Number(raw.evidenceGain) || 0, 0, 0.3),
        confidence: clamp(Number(raw.confidence) || 0.5, 0, 1),
        uniqueInsights: Math.max(0, Math.floor(Number(raw.uniqueInsights) || 0)),
        redundancyRatio: clamp(Number(raw.redundancyRatio) || 0, 0, 1),
        costEfficiency: cost > 0 ? marginalQualityGain / cost : 0,
      };
    });

    // Also include agents that weren't analyzed (failed agents, etc.)
    for (const [agentId, result] of agentResults) {
      if (!contributions.find(c => c.agentId === agentId)) {
        contributions.push({
          agentId,
          agentName: result.agentName,
          marginalQualityGain: result.status === 'COMPLETED' ? 0.05 : 0,
          reliabilityGain: 0,
          cost: result.cost,
          latencyMs: result.latencyMs,
          evidenceGain: 0,
          confidence: 0.3,
          uniqueInsights: 0,
          redundancyRatio: result.status === 'FAILED' ? 0 : 0.5,
          costEfficiency: 0,
        });
      }
    }

    eventBus.emit({
      id: uuidv4(),
      runId,
      type: 'contribution.analyzed',
      timestamp: Date.now(),
      payload: {
        architectureId,
        contributions: contributions.map(c => ({
          agentId: c.agentId,
          agentName: c.agentName,
          marginalQualityGain: c.marginalQualityGain,
          costEfficiency: c.costEfficiency,
          redundancyRatio: c.redundancyRatio,
        })),
      },
    });

    for (const c of contributions) {
      eventBus.log(runId, 'info',
        `Contribution: ${c.agentName} → quality gain: ${(c.marginalQualityGain * 100).toFixed(1)}%, ` +
        `efficiency: ${c.costEfficiency.toFixed(1)}/$ , redundancy: ${(c.redundancyRatio * 100).toFixed(0)}%`
      );
    }

    return contributions;

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    eventBus.log(runId, 'warn', `Contribution analysis failed: ${errorMsg}. Using heuristic fallback.`);

    // Heuristic fallback: estimate from output metrics
    return [...agentResults.entries()].map(([agentId, result]) => {
      const gain = result.status === 'COMPLETED'
        ? Math.min(0.2, result.evidence.length * 0.02 + (result.output.length > 100 ? 0.05 : 0))
        : 0;

      return {
        agentId,
        agentName: result.agentName,
        marginalQualityGain: gain,
        reliabilityGain: gain * 0.5,
        cost: result.cost,
        latencyMs: result.latencyMs,
        evidenceGain: result.evidence.length * 0.01,
        confidence: 0.2,
        uniqueInsights: result.evidence.length,
        redundancyRatio: 0.3,
        costEfficiency: result.cost > 0 ? gain / result.cost : 0,
      };
    });
  }
    }
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
