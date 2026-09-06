// ============================================================
// Neatlogs Observability Integration — Agent Resource Exchange
// ============================================================
// Real integration with official neatlogs TypeScript SDK.
// Provides structured tracing of:
// WORKFLOW -> ARCHITECT -> AGENT -> TOOL -> RESOURCE_DECISION ->
// EVALUATION -> CONTRIBUTION_ANALYSIS -> MUTATION -> ARCHITECTURE_COMPARISON
//
// FAIL-SAFE: Any Neatlogs error or network issue must NEVER crash the run.
// API key is strictly server-side and never sent to browser/SSE/DB.
// ============================================================

import {
  init,
  trace,
  setTraceOutput,
  log,
  wrapOpenAI,
  PromptTemplate,
  UserPromptTemplate,
  flush,
  flushAll,
  type SpanKind,
} from 'neatlogs';
import type OpenAI from 'openai';

let isInitialized = false;

/**
 * Initialize Neatlogs if not already initialized.
 * Safe to call multiple times.
 */
export function initNeatlogs(): boolean {
  if (isInitialized) return true;

  try {
    const apiKey = process.env.NEATLOGS_API_KEY;
    // Neatlogs official docs: If apiKey is unset, export is disabled (no-op mode)
    init({
      apiKey: apiKey || undefined,
      workflowName: 'Agent Resource Exchange',
      captureLogs: true,
      debug: process.env.NODE_ENV === 'development' && !!process.env.NEATLOGS_DEBUG,
    });
    isInitialized = true;
    return true;
  } catch (error) {
    console.warn('[Neatlogs] Initialization failed, continuing with local fallback:', error);
    return false;
  }
}

/**
 * Wraps an OpenAI client instance with official Neatlogs auto-instrumentation.
 * Safe to call; returns wrapped client or original client if wrapping fails.
 */
export function instrumentOpenAIClient(client: OpenAI): OpenAI {
  initNeatlogs();
  try {
    return wrapOpenAI(client);
  } catch (err) {
    console.warn('[Neatlogs] Failed to wrap OpenAI client:', err);
    return client;
  }
}

export type AppSpanKind = 'WORKFLOW' | 'AGENT' | 'CHAIN' | 'TOOL' | 'RETRIEVER' | 'EMBEDDING' | 'GUARDRAIL' | 'MCP_TOOL' | 'TASK' | 'EVALUATOR';

const OFFICIAL_SPAN_KINDS = new Set<string>([
  'WORKFLOW', 'AGENT', 'CHAIN', 'TOOL', 'RETRIEVER', 'EMBEDDING', 'MCP_TOOL', 'GUARDRAIL'
]);

/**
 * Execute an operation within a Neatlogs trace span.
 * Uses official Neatlogs SDK SpanKind mapping so no unsupported kinds are passed.
 * If Neatlogs throws or fails, executes fn() directly so execution never breaks.
 */
export async function withTrace<T>(
  options: {
    name: string;
    kind: AppSpanKind;
    sessionId?: string;
    input?: unknown;
    attributes?: Record<string, unknown>;
    tags?: string[];
  },
  fn: () => Promise<T>
): Promise<T> {
  initNeatlogs();

  // Map to official Neatlogs SpanKind (use CHAIN as closest valid container for custom stages like EVALUATOR/TASK)
  const officialKind: SpanKind = OFFICIAL_SPAN_KINDS.has(options.kind)
    ? (options.kind as SpanKind)
    : 'CHAIN';

  const attrs = {
    ...options.attributes,
    ...(options.kind !== officialKind ? { stage_kind: options.kind } : {}),
  };

  try {
    return await trace(
      {
        name: options.name,
        kind: officialKind,
        sessionId: options.sessionId,
        input: options.input ? (typeof options.input === 'string' ? options.input : JSON.stringify(options.input)) : undefined,
        attributes: sanitizeAttributes(attrs),
        tags: options.tags,
      },
      async () => {
        const result = await fn();
        try {
          if (typeof result === 'string') {
            setTraceOutput(result.slice(0, 1000));
          } else if (result && typeof result === 'object') {
            setTraceOutput(JSON.stringify(result).slice(0, 1000));
          }
        } catch {
          // ignore output serialization errors
        }
        return result;
      }
    );
  } catch (traceError) {
    // If trace wrapping itself failed before/during, guarantee fn executes or rethrow fn error
    console.warn(`[Neatlogs] Trace "${options.name}" error, executing without trace:`, traceError);
    return await fn();
  }
}

/**
 * Log a structured event inside the active Neatlogs span.
 */
export function logTrace(message: string, context?: Record<string, unknown>): void {
  try {
    log(message, context);
  } catch {
    // Fail-safe: ignore logging errors
  }
}

/**
 * Asynchronously flush Neatlogs telemetry without blocking the main workflow.
 */
export function flushTracesAsync(): void {
  try {
    flush().catch((err: unknown) => {
      console.warn('[Neatlogs] Asynchronous flush error:', err);
    });
  } catch {
    // Fail-safe
  }
}

/**
 * Get Neatlogs dashboard URL for this run/session.
 */
export function getNeatlogsSessionUrl(runId: string): string {
  return `https://app.neatlogs.com/sessions/${runId}`;
}

/**
 * Prompt Template helper for tracking prompt versions in Neatlogs
 */
export function createPromptTemplate(templateStr: string): PromptTemplate {
  return new PromptTemplate(templateStr);
}

export function createUserPromptTemplate(templateStr: string): UserPromptTemplate {
  return new UserPromptTemplate(templateStr);
}

/**
 * Sanitize attributes to ensure no secrets or huge JSON objects are attached.
 */
function sanitizeAttributes(attrs?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!attrs) return undefined;
  const sanitized: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(attrs)) {
    // Never expose secret keys
    if (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('password')) {
      continue;
    }
    if (val === null || val === undefined) continue;
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      sanitized[key] = val;
    } else {
      try {
        const str = JSON.stringify(val);
        sanitized[key] = str.length > 500 ? str.slice(0, 500) + '...' : str;
      } catch {
        sanitized[key] = String(val);
      }
    }
  }

  return sanitized;
}
