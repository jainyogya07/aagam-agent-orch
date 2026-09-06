// ============================================================
// Neatlogs Adapter (OpenAI Agents Native Tracing) — Agent Resource Exchange
// ============================================================
// Registers the official Neatlogs `openaiAgentsProcessor()` with the
// @openai/agents global tracing provider.
// Automatically captures real WORKFLOW → AGENT → TURN → LLM → TOOL spans
// without creating synthetic spans or duplicate instrumentation.
// ============================================================

import { addTraceProcessor } from '@openai/agents';
import { openaiAgentsProcessor } from 'neatlogs';

let isProcessorRegistered = false;

export function initializeNeatlogsAgentsTracing(): void {
  if (isProcessorRegistered) return;

  try {
    const processor = openaiAgentsProcessor();
    addTraceProcessor(processor);
    isProcessorRegistered = true;
  } catch (err) {
    console.warn(`[NeatlogsAdapter] Could not initialize native OpenAI Agents trace processor: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export interface TraceCorrelationContext {
  taskId: string;
  runId: string;
  architectureId: string;
  architectureVersion: number;
  agentId?: string;
  sessionId: string;
}

export function buildTraceCorrelationAttributes(ctx: TraceCorrelationContext): Record<string, string | number> {
  return {
    task_id: ctx.taskId,
    run_id: ctx.runId,
    architecture_id: ctx.architectureId,
    architecture_version: ctx.architectureVersion,
    agent_id: ctx.agentId ?? 'orchestrator',
    session_id: ctx.sessionId,
  };
}
