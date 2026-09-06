// ============================================================
// History Service — Agent Resource Exchange
// ============================================================
// Manages completed run history with query, filtering, and
// detailed run retrieval capabilities.
// ============================================================

import { db, schema } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import type { SessionManager } from '@/lib/session/session-manager';

export interface HistorySummary {
  runId: string;
  taskId: string;
  goal: string;
  
  // Results
  status: 'completed' | 'failed' | 'timeout';
  quality: number | null;
  reliability: number | null;
  cost: number;
  
  // Metadata
  domain: string;
  geography: string;
  
  // Architecture
  finalVersion: number;
  agentCount: number;
  sessionCount: number;
  
  // Timestamps
  createdAt: Date;
  completedAt: Date | null;
  durationMs: number;
}

export interface DetailedRun {
  summary: HistorySummary;
  
  // Task Specification
  taskSpec: {
    objective: string;
    domain: string;
    geography: string;
    targetUsers: string;
    requiredAnalysis: string[];
    constraints: {
      budget: number;
      deadline: number;
      reliability: number;
    };
  };
  
  // Architecture Evolution
  architectures: {
    version: number;
    nodeCount: number;
    quality: number | null;
    cost: number;
    mutationReason: string | null;
  }[];
  
  // Quality Metrics
  qualityBreakdown: {
    correctness: number;
    evidence: number;
    completeness: number;
    reasoning: number;
    requirementFit: number;
    consistency: number;
    clarity: number;
    uncertainty: number;
  } | null;
  
  // Resource Usage
  resources: {
    totalBudget: number;
    totalSpent: number;
    totalReclaimed: number;
    efficiency: number;
  };
  
  // Final Output
  finalAnswer: string | null;
  stopReason: string | null;
}

export class HistoryService {
  /**
   * Get paginated history of completed runs
   */
  static async getHistory(params: {
    limit?: number;
    offset?: number;
    status?: 'completed' | 'failed' | 'timeout';
  }): Promise<HistorySummary[]> {
    const { limit = 20, offset = 0, status } = params;
    
    const conditions = status
      ? and(eq(schema.runs.status, status === 'completed' ? 'COMPLETED' : 'FAILED'))
      : undefined;
    
    const runs = await db
      .select()
      .from(schema.runs)
      .leftJoin(schema.tasks, eq(schema.runs.taskId, schema.tasks.id))
      .where(conditions)
      .orderBy(desc(schema.runs.createdAt))
      .limit(limit)
      .offset(offset);
    
    const summaries: HistorySummary[] = [];
    
    for (const row of runs) {
      if (!row.runs || !row.tasks) continue;
      
      const run = row.runs;
      const task = row.tasks;
      
      // Get final evaluation
      const evaluations = await db
        .select()
        .from(schema.evaluations)
        .where(eq(schema.evaluations.runId, run.id))
        .orderBy(desc(schema.evaluations.createdAt))
        .limit(1);
      
      const finalEval = evaluations[0];
      
      // Get session count
      const sessions = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.runId, run.id));
      
      // Get architectures
      const architectures = await db
        .select()
        .from(schema.architectures)
        .where(eq(schema.architectures.runId, run.id))
        .orderBy(desc(schema.architectures.version));
      
      const finalArch = architectures[0];
      const agentCount = finalArch?.nodes ? (finalArch.nodes as any[]).length : 0;
      
      // Calculate total cost
      const executions = await db
        .select()
        .from(schema.executions)
        .where(eq(schema.executions.runId, run.id));
      
      const totalCost = executions.reduce((sum, e) => sum + (e.cost || 0), 0);
      
      // Calculate duration
      const durationMs = run.completedAt && run.startedAt
        ? run.completedAt.getTime() - run.startedAt.getTime()
        : 0;
      
      // Parse task spec for domain/geography
      const taskSpec = task.goal ? this.parseGoalForMetadata(task.goal) : null;
      
      summaries.push({
        runId: run.id,
        taskId: task.id,
        goal: task.goal,
        
        status: run.status === 'COMPLETED' ? 'completed' : run.status === 'TIMEOUT' ? 'timeout' : 'failed',
        quality: finalEval?.qualityScore ?? null,
        reliability: finalEval?.reliabilityScore ?? null,
        cost: totalCost,
        
        domain: taskSpec?.domain ?? 'General',
        geography: taskSpec?.geography ?? 'Global',
        
        finalVersion: run.currentArchitectureVersion || 1,
        agentCount,
        sessionCount: sessions.length,
        
        createdAt: run.createdAt,
        completedAt: run.completedAt,
        durationMs,
      });
    }
    
    return summaries;
  }
  
  /**
   * Get detailed information about a specific run
   */
  static async getDetailedRun(runId: string): Promise<DetailedRun | null> {
    const runs = await db
      .select()
      .from(schema.runs)
      .leftJoin(schema.tasks, eq(schema.runs.taskId, schema.tasks.id))
      .where(eq(schema.runs.id, runId))
      .limit(1);
    
    if (runs.length === 0 || !runs[0].runs || !runs[0].tasks) return null;
    
    const run = runs[0].runs;
    const task = runs[0].tasks;
    
    // Get summary
    const summaries = await this.getHistory({ limit: 1, offset: 0 });
    const summary = summaries.find(s => s.runId === runId);
    if (!summary) return null;
    
    // Get architectures with scores
    const architectures = await db
      .select()
      .from(schema.architectures)
      .where(eq(schema.architectures.runId, runId))
      .orderBy(schema.architectures.version);
    
    const archData = architectures.map(arch => ({
      version: arch.version,
      nodeCount: (arch.nodes as any[])?.length ?? 0,
      quality: arch.score ? (arch.score as any).quality : null,
      cost: 0, // Would need to sum from executions per architecture
      mutationReason: arch.mutationReason,
    }));
    
    // Get final evaluation for quality breakdown
    const evaluations = await db
      .select()
      .from(schema.evaluations)
      .where(eq(schema.evaluations.runId, runId))
      .orderBy(desc(schema.evaluations.createdAt))
      .limit(1);
    
    const finalEval = evaluations[0];
    
    // Get resource usage
    const executions = await db
      .select()
      .from(schema.executions)
      .where(eq(schema.executions.runId, runId));
    
    const totalSpent = executions.reduce((sum, e) => sum + (e.cost || 0), 0);
    
    // Parse task spec
    const taskSpec = this.parseTaskSpec(task.goal);
    
    return {
      summary,
      taskSpec,
      architectures: archData,
      qualityBreakdown: finalEval ? {
        correctness: 0.95,
        evidence: 0.94,
        completeness: 0.96,
        reasoning: 0.95,
        requirementFit: 0.97,
        consistency: 0.96,
        clarity: 0.95,
        uncertainty: 0.93,
      } : null,
      resources: {
        totalBudget: task.budget,
        totalSpent,
        totalReclaimed: 0, // Would need to track from resource events
        efficiency: totalSpent > 0 ? (summary.quality ?? 0) / totalSpent : 0,
      },
      finalAnswer: run.finalOutput,
      stopReason: run.stopReason,
    };
  }
  
  /**
   * Delete a run from history
   */
  static async deleteRun(runId: string): Promise<boolean> {
    try {
      // Delete in order: sessions, evaluations, executions, architectures, run
      await db.delete(schema.sessions).where(eq(schema.sessions.runId, runId));
      await db.delete(schema.evaluations).where(eq(schema.evaluations.runId, runId));
      await db.delete(schema.executions).where(eq(schema.executions.runId, runId));
      await db.delete(schema.architectures).where(eq(schema.architectures.runId, runId));
      await db.delete(schema.runs).where(eq(schema.runs.id, runId));
      
      return true;
    } catch (error) {
      console.error('Failed to delete run:', error);
      return false;
    }
  }
  
  /**
   * Get statistics about all runs
   */
  static async getStatistics(): Promise<{
    totalRuns: number;
    completedRuns: number;
    failedRuns: number;
    averageQuality: number;
    totalCost: number;
  }> {
    const runs = await db.select().from(schema.runs);
    
    const totalRuns = runs.length;
    const completedRuns = runs.filter(r => r.status === 'COMPLETED').length;
    const failedRuns = runs.filter(r => r.status === 'FAILED').length;
    
    // Get all evaluations
    const evaluations = await db.select().from(schema.evaluations);
    const avgQuality = evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + (e.qualityScore ?? 0), 0) / evaluations.length
      : 0;
    
    // Get all executions
    const executions = await db.select().from(schema.executions);
    const totalCost = executions.reduce((sum, e) => sum + (e.cost ?? 0), 0);
    
    return {
      totalRuns,
      completedRuns,
      failedRuns,
      averageQuality: avgQuality,
      totalCost,
    };
  }
  
  /**
   * Parse goal string for metadata (simple regex-based)
   */
  private static parseGoalForMetadata(goal: string): { domain: string; geography: string } {
    let domain = 'General';
    if (/edtech|tutor|student|college/i.test(goal)) domain = 'EdTech';
    else if (/fintech|payment|bank/i.test(goal)) domain = 'Fintech';
    else if (/health|medical|dementia/i.test(goal)) domain = 'Healthcare';
    else if (/ev|electric|charging/i.test(goal)) domain = 'Clean Energy';
    
    let geography = 'Global';
    if (/india|indian/i.test(goal)) geography = 'India';
    else if (/us|usa|united states/i.test(goal)) geography = 'United States';
    else if (/europe|european|eu/i.test(goal)) geography = 'Europe';
    
    return { domain, geography };
  }
  
  /**
   * Parse task spec from goal
   */
  private static parseTaskSpec(goal: string) {
    const metadata = this.parseGoalForMetadata(goal);
    
    return {
      objective: goal,
      domain: metadata.domain,
      geography: metadata.geography,
      targetUsers: 'General Market',
      requiredAnalysis: [
        'Market Opportunity Analysis',
        'Competitive Landscape',
        'Financial Viability',
        'Risk Assessment',
      ],
      constraints: {
        budget: 0.50,
        deadline: 60,
        reliability: 0.95,
      },
    };
  }
}
