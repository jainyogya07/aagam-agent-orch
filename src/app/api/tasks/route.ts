// POST /api/tasks — Create a new task
import { db, schema } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { goal, budget, deadlineSeconds, reliabilityTarget, availableTools, availableModels } = body;

    if (!goal || !budget || !deadlineSeconds) {
      return Response.json({ error: 'Missing required fields: goal, budget, deadlineSeconds' }, { status: 400 });
    }

    const [task] = await db.insert(schema.tasks).values({
      goal,
      budget: Number(budget),
      deadlineSeconds: Number(deadlineSeconds),
      reliabilityTarget: Number(reliabilityTarget) || 0.9,
      availableTools: availableTools || [],
      availableModels: availableModels || [],
    }).returning();

    return Response.json({ task }, { status: 201 });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
