// GET /api/runs/[id] — Get run details
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    return Response.json({
      run: run[0],
      architectures: architecturesList,
      evaluations: evaluationsList,
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
