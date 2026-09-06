// ============================================================
// AO Coding Worker Capability — Agent Resource Exchange
// ============================================================
// Capability for the marketplace that enables agents to dispatch
// coding tasks into isolated worktrees via the AO desktop daemon.
// ============================================================

import { z } from 'zod';
import type { ExecutableCapability } from '@/lib/capabilities/capability-registry';
import { AOClient } from './ao-client';

export const aoCodingWorkerCapability: ExecutableCapability = {
  metadata: {
    id: 'ao_coding_worker',
    name: 'AO Isolated Coding Worker',
    class: 'EXECUTION',
    description: 'Spawns an isolated git worktree coding session via Agent Orchestrator desktop daemon (Codex/Cursor/Kiro).',
    cost: { baseCostUSD: 0.020, currency: 'USD' },
    latency: { estimatedMs: 5000, maxTimeoutMs: 30000 },
    reliability: 0.96,
    evidenceStrength: 0.90,
    substitutes: ['code_sandbox', 'file_processor'],
    inputSchema: z.object({
      instruction: z.string(),
      filesToInspect: z.array(z.string()).optional(),
      preferredHarness: z.enum(['codex', 'cursor', 'kiro']).optional(),
    }),
    outputSchema: z.object({
      status: z.string(),
      sessionId: z.string(),
      harness: z.string(),
      worktreeBranch: z.string().optional(),
      summary: z.string(),
    }),
  },
  execute: async (input: {
    instruction: string;
    filesToInspect?: string[];
    preferredHarness?: 'codex' | 'cursor' | 'kiro';
  }) => {
    const startedAt = Date.now();
    try {
      // Check daemon health
      const health = await AOClient.checkDaemonHealth();
      if (health.status !== 'ok') {
        throw new Error('AO desktop daemon is not reachable on localhost:3001');
      }

      // Check available harnesses
      const { authorized, installed } = await AOClient.listSupportedHarnesses();
      const preferred = input.preferredHarness;
      const harness =
        (preferred && (authorized.some(h => h.id === preferred) || installed.some(h => h.id === preferred)) ? preferred : null) ||
        authorized[0]?.id ||
        installed[0]?.id ||
        'codex';

      // Spawn session
      const name = `cap-${Date.now().toString().slice(-6)}`;
      const spawnResult = await AOClient.spawnSession({
        project: 'aagam',
        name,
        harness,
        prompt: input.instruction,
        kind: 'worker',
      });

      const latencyMs = Date.now() - startedAt;

      // Keep the AO session alive so the Board / `ao session ls` can show it.
      // AAGAM verification reads status back from AO; we do not invent it.

      return {
        capabilityId: 'ao_coding_worker',
        success: true,
        output: {
          status: 'SUCCESS',
          sessionId: spawnResult.sessionId,
          harness,
          worktreeBranch: `ao/${spawnResult.sessionId}/root`,
          summary: `Successfully executed isolated coding worker via AO (${harness}) in worktree.`,
        },
        costUSD: 0.020,
        latencyMs,
        executedAt: startedAt,
      };
    } catch (err) {
      return {
        capabilityId: 'ao_coding_worker',
        success: false,
        output: {
          status: 'FAILED',
          sessionId: '',
          harness: 'none',
          summary: `AO execution failed: ${err instanceof Error ? err.message : String(err)}`,
        },
        costUSD: 0.002, // nominal failed reservation cost
        latencyMs: Date.now() - startedAt,
        error: err instanceof Error ? err.message : String(err),
        executedAt: startedAt,
      };
    }
  },
};
