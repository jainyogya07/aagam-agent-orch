// ============================================================
// Tool Runtime (OpenAI Agents SDK Wrapper) — Agent Resource Exchange
// ============================================================
// Wraps capabilities from the Capability Marketplace into official
// @openai/agents `tool({...})` instances with Zod schema validation.
// Tracks execution metrics, real costs, and tool call records.
// ============================================================

import { tool, type Tool } from '@openai/agents';
import { getCapabilityById } from '@/lib/capabilities/capability-catalog';
import type { ToolCallRecord } from '@/lib/types/evaluation';

export interface ToolRuntimeSession {
  records: ToolCallRecord[];
  totalCostUSD: number;
}

export class ToolRuntime {
  /**
   * Adapts a list of capability IDs into official OpenAI Agents SDK tools.
   * Execution records and costs are accumulated in the provided session tracker.
   */
  public static adaptCapabilities(
    capabilityIds: string[],
    sessionTracker: ToolRuntimeSession
  ): Tool[] {
    const sdkTools: Tool[] = [];

    for (const id of capabilityIds) {
      const capability = getCapabilityById(id);
      if (!capability) continue;

      const { metadata, execute } = capability;

      const sdkTool = tool({
        name: metadata.id,
        description: `${metadata.name}: ${metadata.description}`,
        parameters: metadata.inputSchema,
        execute: async (input: any) => {
          const startedAt = Date.now();
          try {
            const result = await execute(input);
            const latencyMs = Date.now() - startedAt;

            sessionTracker.records.push({
              toolId: metadata.id,
              toolName: metadata.name,
              input: JSON.stringify(input).slice(0, 300),
              output: result.output,
              cost: result.costUSD,
              latencyMs,
              success: result.success,
            });

            sessionTracker.totalCostUSD += result.costUSD;
            return result.output;
          } catch (error) {
            const latencyMs = Date.now() - startedAt;
            sessionTracker.records.push({
              toolId: metadata.id,
              toolName: metadata.name,
              input: JSON.stringify(input).slice(0, 300),
              output: null,
              cost: metadata.cost.baseCostUSD * 0.1,
              latencyMs,
              success: false,
            });
            throw error;
          }
        },
      });

      sdkTools.push(sdkTool);
    }

    return sdkTools;
  }
}
