import { NextResponse } from 'next/server';
import { AOClient } from '@/lib/runtime/ao/ao-client';
import { AOSessionAdapter } from '@/lib/runtime/ao/ao-session-adapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const health = await AOClient.checkDaemonHealth();
  const sessions =
    health.status === 'ok'
      ? await AOClient.listSessions('aagam', true)
      : [];
  const harnesses =
    health.status === 'ok' ? await AOClient.listSupportedHarnesses() : { supported: [], installed: [], authorized: [] };

  return NextResponse.json({
    daemon: health,
    fake: false,
    sessions,
    correlations: AOSessionAdapter.listCorrelations(),
    harnesses: {
      installed: harnesses.installed.map((h) => h.id),
      authorized: harnesses.authorized.map((h) => h.id),
    },
    note:
      health.status === 'ok'
        ? 'Live AO daemon. Status below is from `ao session ls`, not a UI animation.'
        : 'AO daemon is not reachable on localhost:3001. AAGAM will not invent a session.',
  });
}
