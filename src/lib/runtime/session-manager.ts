// ============================================================
// Scoped Session Manager — Agent Resource Exchange
// ============================================================
// Manages three explicit session tiers:
// 1. Task Session: Long-lived user intent & constraints.
// 2. Architecture Iteration Session: Versioned execution boundary (V1 vs V2).
// 3. Agent Session: Specialist-specific context isolated from unrelated agents.
//
// Injects relevant upstream artifacts into downstream sessions without
// dumping full conversational histories (preventing token bloat).
// ============================================================

import { PersistentDBSession } from './persistent-session';
import type { Session, AgentInputItem } from '@openai/agents';
import type { ArtifactEnvelope } from '@/lib/types/artifacts';

export interface SessionContextScope {
  taskId: string;
  runId: string;
  architectureVersion: number;
  agentId?: string;
}

export class SessionManager {
  private static activeSessions = new Map<string, PersistentDBSession>();

  /**
   * Generates a stable, scoped session ID.
   */
  public static getSessionId(scope: SessionContextScope): string {
    if (scope.agentId) {
      return `task_${scope.taskId}__run_${scope.runId}__v${scope.architectureVersion}__agent_${scope.agentId}`;
    }
    return `task_${scope.taskId}__run_${scope.runId}__v${scope.architectureVersion}`;
  }

  /**
   * Retrieves or instantiates a PersistentDBSession for the given scope.
   */
  public static getOrCreateSession(scope: SessionContextScope): PersistentDBSession {
    const sessionId = this.getSessionId(scope);
    if (!this.activeSessions.has(sessionId)) {
      const session = new PersistentDBSession({ sessionId });
      this.activeSessions.set(sessionId, session);
    }
    return this.activeSessions.get(sessionId)!;
  }

  /**
   * Injects upstream artifacts cleanly into the agent's persistent session as structured context.
   */
  public static async injectArtifactsIntoAgentSession(
    session: Session,
    artifacts: ArtifactEnvelope[],
    agentObjective: string
  ): Promise<void> {
    if (artifacts.length === 0) return;

    const existing = await session.getItems(50);
    const hasAlreadyInjected = existing.some(item =>
      typeof item === 'object' && item !== null && 'content' in item &&
      typeof item.content === 'string' && item.content.includes('UPSTREAM ARTIFACT REPOSITORY')
    );

    if (hasAlreadyInjected) return;

    let artifactSummary = '## UPSTREAM ARTIFACT REPOSITORY\n';
    artifactSummary += `The following verified artifacts were produced by upstream specialists and are available to support your objective: "${agentObjective}"\n\n`;

    for (const art of artifacts) {
      artifactSummary += `### [Artifact: ${art.type}] ${art.title}\n`;
      artifactSummary += `Producer: ${art.lineage.producerAgentName} (V${art.lineage.architectureVersion})\n`;
      artifactSummary += `Summary: ${art.summary}\n`;
      artifactSummary += `Verified Data: ${JSON.stringify(art.data, null, 2)}\n`;
      artifactSummary += `---\n\n`;
    }

    const item: AgentInputItem = {
      role: 'user',
      content: artifactSummary,
    };

    await session.addItems([item]);
  }
}
