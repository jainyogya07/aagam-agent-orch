// GET /api/runs/[id] — Get run details
import { db, schema, dbAvailable } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!dbAvailable) {
      return Response.json({ error: 'Database is not configured on this host.' }, { status: 503 });
    }

    const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return Response.json({ error: 'Run not found' }, { status: 404 });
    }

    const run = await db.select().from(schema.runs).where(eq(schema.runs.id, id)).limit(1);
    if (run.length === 0) {
      return Response.json({ error: 'Run not found' }, { status: 404 });
    }

    const architecturesList = await db.select()
      .from(schema.architectures)
      .where(eq(schema.architectures.runId, id))
      .orderBy(schema.architectures.version);

    const evaluationsList = await db.select()
      .from(schema.evaluations)
      .where(eq(schema.evaluations.runId, id));

    const eventsList = await db.select()
      .from(schema.events)
      .where(eq(schema.events.runId, id))
      .orderBy(schema.events.createdAt);

    const executionsList = await db.select()
      .from(schema.executions)
      .where(eq(schema.executions.runId, id));

    const { AOSessionAdapter } = await import('@/lib/runtime/ao/ao-session-adapter');
    const aoCorrelations = AOSessionAdapter.listCorrelations().filter(c => c.runId === id);

    return Response.json({
      run: run[0],
      architectures: architecturesList,
      evaluations: evaluationsList,
      executions: executionsList,
      aoSessions: aoCorrelations,
      events: eventsList.map(e => ({
        id: e.id,
        runId: e.runId,
        type: e.eventType,
        payload: e.payload,
        timestamp: e.createdAt.getTime(),
      })),
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
