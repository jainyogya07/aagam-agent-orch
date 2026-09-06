import { db, schema } from '@/lib/db';
import { executeRun } from '@/lib/orchestrator/run-orchestrator';
import { getNeatlogsSessionUrl } from '@/lib/observability/neatlogs';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      taskId,
      goal,
      budget,
      deadlineSeconds,
      reliabilityTarget,
      availableModels,
      availableTools,
      maxIterations,
      benchmarkMode,
      async: isAsync,
    } = body;

    // If taskId provided, fetch from DB. Otherwise create inline.
    let finalGoal = goal;
    let finalBudget = budget;
    let finalDeadline = deadlineSeconds;
    let finalReliability = reliabilityTarget || 0.9;
    let finalTaskId = taskId;

    if (taskId) {
      const task = await db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).limit(1);
      if (task.length === 0) {
        return Response.json({ error: 'Task not found' }, { status: 404 });
      }
      finalGoal = task[0].goal;
      finalBudget = task[0].budget;
      finalDeadline = task[0].deadlineSeconds;
      finalReliability = task[0].reliabilityTarget;
    } else {
      // Create task inline
      if (!goal || !budget || !deadlineSeconds) {
        return Response.json({ error: 'Missing required fields' }, { status: 400 });
      }
      const [newTask] = await db.insert(schema.tasks).values({
        goal: finalGoal,
        budget: Number(finalBudget),
        deadlineSeconds: Number(finalDeadline),
        reliabilityTarget: Number(finalReliability),
        availableTools: availableTools || [],
        availableModels: availableModels || [],
        status: 'RUNNING',
      }).returning();
      finalTaskId = newTask.id;
    }

    const runId = uuidv4();

    // Create run record in DB
    await db.insert(schema.runs).values({
      id: runId,
      taskId: finalTaskId,
      status: 'RUNNING',
      maxIterations: maxIterations ?? 3,
      startedAt: new Date(),
    });

    // Execute run
    const runPromise = executeRun({
      runId,
      taskId: finalTaskId,
      goal: finalGoal,
      budget: Number(finalBudget),
      deadlineSeconds: Number(finalDeadline),
      reliabilityTarget: Number(finalReliability),
      availableModels,
      availableTools,
      maxIterations: maxIterations ?? 3,
      benchmarkMode,
    });

    const neatlogsUrl = getNeatlogsSessionUrl(runId);

    if (isAsync) {
      // Async mode: return immediately so client can stream SSE events
      runPromise.catch((err) => {
        console.error(`[API /runs] Async execution error for run ${runId}:`, err);
      });

      return Response.json({
        runId,
        taskId: finalTaskId,
        status: 'RUNNING',
        neatlogsUrl,
      }, { status: 202 });
    }

    const result = await runPromise;

    return Response.json({
      runId: result.runId,
      status: 'COMPLETED',
      bestArchitectureVersion: result.bestArchitecture.version,
      qualityScore: result.bestEvaluation.qualityScore,
      reliabilityScore: result.bestEvaluation.reliabilityScore,
      totalCost: result.totalCost,
      totalTimeMs: result.totalTimeMs,
      stopReason: result.stopReason,
      neatlogsUrl,
      architectureVersions: result.architectureVersions.map(v => ({
        version: v.architecture.version,
        agents: v.architecture.nodes.length,
        cost: v.schedulerResult.totalCost,
        quality: v.evaluation.qualityScore,
        reliability: v.evaluation.reliabilityScore,
        latency: v.schedulerResult.wallClockMs,
      })),
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /runs] Error:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}

// GET /api/runs — List all runs
export async function GET() {
  try {
    const allRuns = await db.select().from(schema.runs).orderBy(schema.runs.createdAt);
    return Response.json({ runs: allRuns });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
