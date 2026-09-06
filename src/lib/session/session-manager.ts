// ============================================================
// Session Manager — Agent Resource Exchange
// ============================================================
// Persistent session management with hierarchical relationships.
// Handles creation, updates, parent-child linking, and queries.
// ============================================================

import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import type {
  TaskSession,
  ArchitectureSession,
  AgentSession,
  BaseSession,
  SessionStatus,
} from '@/lib/types/session';

export class SessionManager {
  // ========================================
  // Task Session Methods
  // ========================================
  
  static async createTaskSession(session: TaskSession): Promise<void> {
    await db.insert(schema.sessions).values({
      id: session.id,
      type: 'TASK',
      runId: session.runId,
      status: session.status,
      
      parentSessionId: null,
      childSessionIds: [],
      
      taskId: session.taskId,
      goal: session.goal,
      taskSpec: session.taskSpec as any,
      benchmarkMode: session.benchmarkMode,
      availableModels: session.availableModels,
      availableTools: session.availableTools,
      maxIterations: session.maxIterations,
      architectureSessionIds: [],
      
      budgetUSD: session.budgetUSD,
      costUSD: 0,
      tokensUsed: 0,
      
      inputContext: session.inputContext as any,
      outputContext: null,
      inputArtifactIds: [],
      outputArtifactIds: [],
      metadata: session.metadata as any,
      
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      createdAt: session.createdAt,
    });
  }
  
  static async updateTaskSession(
    sessionId: string,
    updates: Partial<TaskSession>
  ): Promise<void> {
    const dbUpdates: Record<string, any> = {};
    
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.costUSD !== undefined) dbUpdates.costUSD = updates.costUSD;
    if (updates.tokensUsed !== undefined) dbUpdates.tokensUsed = updates.tokensUsed;
    if (updates.architectureSessionIds) dbUpdates.architectureSessionIds = updates.architectureSessionIds;
    if (updates.bestArchitectureSessionId) dbUpdates.bestArchitectureSessionId = updates.bestArchitectureSessionId;
    if (updates.bestQualityScore !== undefined) dbUpdates.bestQualityScore = updates.bestQualityScore;
    if (updates.stopReason) dbUpdates.stopReason = updates.stopReason;
    if (updates.finalOutput) dbUpdates.finalOutput = updates.finalOutput;
    if (updates.outputContext) dbUpdates.outputContext = updates.outputContext as any;
    if (updates.startedAt) dbUpdates.startedAt = updates.startedAt;
    if (updates.completedAt) dbUpdates.completedAt = updates.completedAt;
    
    await db.update(schema.sessions)
      .set(dbUpdates)
      .where(eq(schema.sessions.id, sessionId));
  }
  
  static async getTaskSession(sessionId: string): Promise<TaskSession | null> {
    const rows = await db.select()
      .from(schema.sessions)
      .where(and(
        eq(schema.sessions.id, sessionId),
        eq(schema.sessions.type, 'TASK')
      ))
      .limit(1);
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: row.id,
      type: 'TASK',
      runId: row.runId,
      taskId: row.taskId!,
      status: row.status,
      
      parentSessionId: row.parentSessionId,
      childSessionIds: row.childSessionIds || [],
      
      createdAt: row.createdAt,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      
      budgetUSD: row.budgetUSD,
      costUSD: row.costUSD || 0,
      tokensUsed: row.tokensUsed || 0,
      
      inputContext: (row.inputContext as any) || {},
      outputContext: (row.outputContext as any) || null,
      
      inputArtifactIds: row.inputArtifactIds || [],
      outputArtifactIds: row.outputArtifactIds || [],
      
      metadata: (row.metadata as any) || {},
      error: row.error,
      
      goal: row.goal!,
      taskSpec: row.taskSpec as any,
      benchmarkMode: row.benchmarkMode as any,
      availableModels: row.availableModels || [],
      availableTools: row.availableTools || [],
      maxIterations: row.maxIterations || 2,
      
      architectureSessionIds: row.architectureSessionIds || [],
      bestArchitectureSessionId: row.bestArchitectureSessionId,
      bestQualityScore: row.bestQualityScore,
      stopReason: row.stopReason,
      finalOutput: row.finalOutput,
    };
  }
  
  // ========================================
  // Architecture Session Methods
  // ========================================
  
  static async createArchitectureSession(session: ArchitectureSession): Promise<void> {
    await db.insert(schema.sessions).values({
      id: session.id,
      type: 'ARCHITECTURE',
      runId: session.runId,
      status: session.status,
      
      parentSessionId: session.parentSessionId,
      childSessionIds: [],
      
      taskSessionId: session.taskSessionId,
      version: session.version,
      architectureId: session.architectureId,
      parentArchitectureSessionId: session.parentArchitectureSessionId,
      
      nodes: session.nodes as any,
      edges: session.edges as any,
      resourcePolicy: session.resourcePolicy as any,
      
      agentSessionIds: [],
      mutationReason: session.mutationReason,
      mutationType: session.mutationType,
      
      budgetUSD: session.budgetUSD,
      costUSD: 0,
      tokensUsed: 0,
      
      inputContext: session.inputContext as any,
      outputContext: null,
      inputArtifactIds: session.inputArtifactIds,
      outputArtifactIds: [],
      metadata: session.metadata as any,
      
      resourceReservations: [],
      resourceReclamations: [],
      
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      createdAt: session.createdAt,
    });
    
    // Link to parent task session
    await this.addChildSession(session.taskSessionId, session.id);
  }
  
  static async updateArchitectureSession(
    sessionId: string,
    updates: Partial<ArchitectureSession>
  ): Promise<void> {
    const dbUpdates: Record<string, any> = {};
    
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.costUSD !== undefined) dbUpdates.costUSD = updates.costUSD;
    if (updates.tokensUsed !== undefined) dbUpdates.tokensUsed = updates.tokensUsed;
    if (updates.agentSessionIds) dbUpdates.agentSessionIds = updates.agentSessionIds;
    if (updates.qualityScore !== undefined) dbUpdates.qualityScore = updates.qualityScore;
    if (updates.reliabilityScore !== undefined) dbUpdates.reliabilityScore = updates.reliabilityScore;
    if (updates.evidenceScore !== undefined) dbUpdates.evidenceScore = updates.evidenceScore;
    if (updates.resourceReservations) dbUpdates.resourceReservations = updates.resourceReservations as any;
    if (updates.resourceReclamations) dbUpdates.resourceReclamations = updates.resourceReclamations as any;
    if (updates.outputContext) dbUpdates.outputContext = updates.outputContext as any;
    if (updates.outputArtifactIds) dbUpdates.outputArtifactIds = updates.outputArtifactIds;
    if (updates.startedAt) dbUpdates.startedAt = updates.startedAt;
    if (updates.completedAt) dbUpdates.completedAt = updates.completedAt;
    
    await db.update(schema.sessions)
      .set(dbUpdates)
      .where(eq(schema.sessions.id, sessionId));
  }
  
  static async getArchitectureSession(sessionId: string): Promise<ArchitectureSession | null> {
    const rows = await db.select()
      .from(schema.sessions)
      .where(and(
        eq(schema.sessions.id, sessionId),
        eq(schema.sessions.type, 'ARCHITECTURE')
      ))
      .limit(1);
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: row.id,
      type: 'ARCHITECTURE',
      runId: row.runId,
      taskSessionId: row.taskSessionId!,
      status: row.status,
      
      parentSessionId: row.parentSessionId,
      childSessionIds: row.childSessionIds || [],
      
      createdAt: row.createdAt,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      
      budgetUSD: row.budgetUSD,
      costUSD: row.costUSD || 0,
      tokensUsed: row.tokensUsed || 0,
      
      inputContext: (row.inputContext as any) || {},
      outputContext: (row.outputContext as any) || null,
      
      inputArtifactIds: row.inputArtifactIds || [],
      outputArtifactIds: row.outputArtifactIds || [],
      
      metadata: (row.metadata as any) || {},
      error: row.error,
      
      version: row.version!,
      architectureId: row.architectureId!,
      parentArchitectureSessionId: row.parentArchitectureSessionId,
      
      nodes: (row.nodes as any) || [],
      edges: (row.edges as any) || [],
      resourcePolicy: row.resourcePolicy as any,
      
      agentSessionIds: row.agentSessionIds || [],
      
      mutationReason: row.mutationReason,
      mutationType: row.mutationType,
      expectedImprovement: row.expectedImprovement,
      
      qualityScore: row.qualityScore,
      reliabilityScore: row.reliabilityScore,
      evidenceScore: row.evidenceScore,
      
      resourceReservations: (row.resourceReservations as any) || [],
      resourceReclamations: (row.resourceReclamations as any) || [],
    };
  }
  
  // ========================================
  // Agent Session Methods
  // ========================================
  
  static async createAgentSession(session: AgentSession): Promise<void> {
    await db.insert(schema.sessions).values({
      id: session.id,
      type: 'AGENT',
      runId: session.runId,
      status: session.status,
      
      parentSessionId: session.parentSessionId,
      childSessionIds: [],
      
      taskSessionId: session.taskSessionId,
      architectureSessionId: session.architectureSessionId,
      
      agentNodeId: session.agentNodeId,
      agentName: session.agentName,
      agentRole: session.agentRole,
      
      model: session.model,
      systemPrompt: session.systemPrompt,
      tools: session.tools,
      maxTokens: session.maxTokens,
      resourceBudget: session.resourceBudget as any,
      
      input: null,
      output: null,
      toolCalls: [],
      claims: [],
      evidenceItems: [],
      
      tokensIn: 0,
      tokensOut: 0,
      latencyMs: 0,
      
      budgetUSD: session.budgetUSD,
      costUSD: 0,
      tokensUsed: 0,
      
      inputContext: session.inputContext as any,
      outputContext: null,
      inputArtifactIds: session.inputArtifactIds,
      outputArtifactIds: [],
      metadata: session.metadata as any,
      
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      createdAt: session.createdAt,
    });
    
    // Link to parent architecture session
    await this.addChildSession(session.architectureSessionId, session.id);
  }
  
  static async updateAgentSession(
    sessionId: string,
    updates: Partial<AgentSession>
  ): Promise<void> {
    const dbUpdates: Record<string, any> = {};
    
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.input) dbUpdates.input = updates.input;
    if (updates.output) dbUpdates.output = updates.output;
    if (updates.toolCalls) dbUpdates.toolCalls = updates.toolCalls as any;
    if (updates.claims) dbUpdates.claims = updates.claims as any;
    if (updates.evidenceItems) dbUpdates.evidenceItems = updates.evidenceItems as any;
    if (updates.tokensIn !== undefined) dbUpdates.tokensIn = updates.tokensIn;
    if (updates.tokensOut !== undefined) dbUpdates.tokensOut = updates.tokensOut;
    if (updates.latencyMs !== undefined) dbUpdates.latencyMs = updates.latencyMs;
    if (updates.costUSD !== undefined) dbUpdates.costUSD = updates.costUSD;
    if (updates.tokensUsed !== undefined) dbUpdates.tokensUsed = updates.tokensUsed;
    if (updates.contributionScore !== undefined) dbUpdates.contributionScore = updates.contributionScore;
    if (updates.marginalValue !== undefined) dbUpdates.marginalValue = updates.marginalValue;
    if (updates.traceId) dbUpdates.traceId = updates.traceId;
    if (updates.spanIds) dbUpdates.spanIds = updates.spanIds;
    if (updates.outputContext) dbUpdates.outputContext = updates.outputContext as any;
    if (updates.outputArtifactIds) dbUpdates.outputArtifactIds = updates.outputArtifactIds;
    if (updates.error) dbUpdates.error = updates.error;
    if (updates.startedAt) dbUpdates.startedAt = updates.startedAt;
    if (updates.completedAt) dbUpdates.completedAt = updates.completedAt;
    
    await db.update(schema.sessions)
      .set(dbUpdates)
      .where(eq(schema.sessions.id, sessionId));
  }
  
  static async getAgentSession(sessionId: string): Promise<AgentSession | null> {
    const rows = await db.select()
      .from(schema.sessions)
      .where(and(
        eq(schema.sessions.id, sessionId),
        eq(schema.sessions.type, 'AGENT')
      ))
      .limit(1);
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: row.id,
      type: 'AGENT',
      runId: row.runId,
      taskSessionId: row.taskSessionId!,
      architectureSessionId: row.architectureSessionId!,
      status: row.status,
      
      parentSessionId: row.parentSessionId,
      childSessionIds: row.childSessionIds || [],
      
      createdAt: row.createdAt,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      
      budgetUSD: row.budgetUSD,
      costUSD: row.costUSD || 0,
      tokensUsed: row.tokensUsed || 0,
      
      inputContext: (row.inputContext as any) || {},
      outputContext: (row.outputContext as any) || null,
      
      inputArtifactIds: row.inputArtifactIds || [],
      outputArtifactIds: row.outputArtifactIds || [],
      
      metadata: (row.metadata as any) || {},
      error: row.error,
      
      agentNodeId: row.agentNodeId!,
      agentName: row.agentName!,
      agentRole: row.agentRole!,
      
      model: row.model!,
      systemPrompt: row.systemPrompt!,
      tools: row.tools || [],
      maxTokens: row.maxTokens || 4000,
      
      resourceBudget: row.resourceBudget as any,
      
      input: row.input,
      output: row.output,
      toolCalls: (row.toolCalls as any) || [],
      
      claims: (row.claims as any) || [],
      evidenceItems: (row.evidenceItems as any) || [],
      
      tokensIn: row.tokensIn || 0,
      tokensOut: row.tokensOut || 0,
      latencyMs: row.latencyMs || 0,
      
      contributionScore: row.contributionScore,
      marginalValue: row.marginalValue,
      
      traceId: row.traceId,
      spanIds: row.spanIds || [],
    };
  }
  
  // ========================================
  // Hierarchy Methods
  // ========================================
  
  private static async addChildSession(parentId: string, childId: string): Promise<void> {
    const parent = await db.select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, parentId))
      .limit(1);
    
    if (parent.length === 0) return;
    
    const currentChildren = parent[0].childSessionIds || [];
    if (!currentChildren.includes(childId)) {
      await db.update(schema.sessions)
        .set({ childSessionIds: [...currentChildren, childId] })
        .where(eq(schema.sessions.id, parentId));
    }
  }
  
  static async getChildSessions(parentId: string): Promise<BaseSession[]> {
    const rows = await db.select()
      .from(schema.sessions)
      .where(eq(schema.sessions.parentSessionId, parentId));
    
    return rows.map(row => ({
      id: row.id,
      type: row.type,
      runId: row.runId,
      status: row.status,
      parentSessionId: row.parentSessionId,
      childSessionIds: row.childSessionIds || [],
      createdAt: row.createdAt,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      budgetUSD: row.budgetUSD,
      costUSD: row.costUSD || 0,
      tokensUsed: row.tokensUsed || 0,
      inputContext: (row.inputContext as any) || {},
      outputContext: (row.outputContext as any) || null,
      inputArtifactIds: row.inputArtifactIds || [],
      outputArtifactIds: row.outputArtifactIds || [],
      metadata: (row.metadata as any) || {},
      error: row.error,
    }));
  }
  
  // ========================================
  // Query Methods
  // ========================================
  
  static async getSessionsByRun(runId: string): Promise<BaseSession[]> {
    const rows = await db.select()
      .from(schema.sessions)
      .where(eq(schema.sessions.runId, runId));
    
    return rows.map(row => ({
      id: row.id,
      type: row.type,
      runId: row.runId,
      status: row.status,
      parentSessionId: row.parentSessionId,
      childSessionIds: row.childSessionIds || [],
      createdAt: row.createdAt,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      budgetUSD: row.budgetUSD,
      costUSD: row.costUSD || 0,
      tokensUsed: row.tokensUsed || 0,
      inputContext: (row.inputContext as any) || {},
      outputContext: (row.outputContext as any) || null,
      inputArtifactIds: row.inputArtifactIds || [],
      outputArtifactIds: row.outputArtifactIds || [],
      metadata: (row.metadata as any) || {},
      error: row.error,
    }));
  }
  
  static async getSessionCount(runId: string): Promise<number> {
    const result = await db.select()
      .from(schema.sessions)
      .where(eq(schema.sessions.runId, runId));
    
    return result.length;
  }
}
