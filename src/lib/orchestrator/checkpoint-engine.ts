// ============================================================
// Orchestration Checkpoints & Crash Recovery Engine — Agent Resource Exchange
// ============================================================
// Persists orchestration checkpoints after every major state transition.
// If the Node.js process restarts, the engine loads completed state,
// reclaims unspent reservations, and resumes only uncompleted work.
// ============================================================

import fs from 'fs';
import path from 'path';

export type CheckpointTransition =
  | 'TASK_PARSED'
  | 'ARCHITECTURE_CREATED'
  | 'AGENT_STARTED'
  | 'AGENT_COMPLETED'
  | 'ARTIFACT_CREATED'
  | 'EVALUATION_COMPLETED'
  | 'CONTRIBUTION_ANALYZED'
  | 'MUTATION_ACCEPTED'
  | 'ARCHITECTURE_COMPLETED';

export interface OrchestratorCheckpoint {
  runId: string;
  architectureVersion: number;
  lastTransition: CheckpointTransition;
  completedAgentIds: string[];
  persistedArtifactIds: string[];
  totalMoneySpentUSD: number;
  totalTokensUsed: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export class CheckpointEngine {
  private static storageDir = path.join(process.cwd(), '.checkpoints');

  private static ensureDir(): void {
    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true });
      } catch {
        // Safe fallback in restricted environments
      }
    }
  }

  /**
   * Persists an orchestration checkpoint.
   */
  public static saveCheckpoint(checkpoint: OrchestratorCheckpoint): void {
    this.ensureDir();
    const filePath = path.join(this.storageDir, `checkpoint_${checkpoint.runId}.json`);
    try {
      fs.writeFileSync(filePath, JSON.stringify(checkpoint, null, 2), 'utf8');
    } catch (err) {
      console.warn(`[CheckpointEngine] Could not save checkpoint: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Retrieves the latest checkpoint for a run to resume interrupted work.
   */
  public static loadCheckpoint(runId: string): OrchestratorCheckpoint | null {
    this.ensureDir();
    const filePath = path.join(this.storageDir, `checkpoint_${runId}.json`);
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
      }
    } catch {
      // Return null on read error
    }
    return null;
  }
}
