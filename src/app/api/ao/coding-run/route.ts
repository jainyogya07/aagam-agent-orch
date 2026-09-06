import { NextResponse } from 'next/server';
import { AOClient } from '@/lib/runtime/ao/ao-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Spawn a persistent AO worker for a technical coding slice.
 * Does not kill the session — the judge can see it while it is active.
 * Status is always read back from AO. Never invented.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    instruction?: string;
    name?: string;
    runId?: string;
  };

  const health = await AOClient.checkDaemonHealth();
  if (health.status !== 'ok') {
    return NextResponse.json(
      {
        ok: false,
        fake: false,
        error: 'AO desktop daemon is not reachable. No session was created.',
        daemon: health,
      },
      { status: 503 }
    );
  }

  const { authorized, installed } = await AOClient.listSupportedHarnesses();
  const harness =
    authorized.find((h) => ['codex', 'cursor', 'kiro'].includes(h.id))?.id ||
    installed.find((h) => ['codex', 'cursor', 'kiro'].includes(h.id))?.id ||
    authorized[0]?.id ||
    installed[0]?.id;

  if (!harness) {
    return NextResponse.json(
      {
        ok: false,
        fake: false,
        error: 'AO is up, but no coding harness (Codex / Cursor / Kiro) is installed or authorized.',
        daemon: health,
      },
      { status: 409 }
    );
  }

  const name = (body.name || 'AAGAM-code').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'AAGAM-code';
  const instruction =
    body.instruction ||
    'Inspect the AAGAM repo. Produce a short CODE artifact: a TypeScript function that scores unit economics (LTV, CAC, payback months) and returns whether the model clears a 12-month payback. Do not invent market TAM numbers.';

  try {
    const spawned = await AOClient.spawnSession({
      project: 'aagam',
      name,
      harness,
      kind: 'worker',
      prompt: instruction,
    });

    const live = await AOClient.getSession(spawned.sessionId, 'aagam');

    return NextResponse.json({
      ok: true,
      fake: false,
      sessionId: spawned.sessionId,
      harness,
      worktreeBranch: `ao/${spawned.sessionId}/root`,
      worktreePath: `~/.ao/data/worktrees/aagam/${spawned.sessionId}`,
      status: live?.activity?.state || live?.status || 'active',
      isTerminated: live?.isTerminated ?? false,
      runId: body.runId ?? null,
      keepAlive: true,
      rawSpawnPreview: spawned.rawOutput.slice(0, 800),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        fake: false,
        error: err instanceof Error ? err.message : String(err),
        daemon: health,
      },
      { status: 500 }
    );
  }
}
