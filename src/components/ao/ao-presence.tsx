'use client';

export type AoSessionLite = {
  id: string;
  name?: string;
  displayName?: string;
  status?: string;
  harness?: string;
  role?: string;
  isTerminated?: boolean;
  activity?: { state?: string };
};

export function AoPresenceStrip({
  ok,
  sessions,
}: {
  ok: boolean;
  sessions: AoSessionLite[];
}) {
  const live = sessions.filter((s) => !s.isTerminated);
  return (
    <div className="glass-card rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-400">AO on this machine</p>
          <p className="text-base font-medium">
            {ok
              ? live.length
                ? `${live.length} live session${live.length === 1 ? '' : 's'}`
                : 'Daemon is up. No live session yet.'
              : 'AO desktop app is not reachable'}
          </p>
        </div>
        <span className={`text-sm px-2.5 py-0.5 rounded-full border ${ok ? 'border-white/25' : 'border-white/10 text-zinc-500'}`}>
          {ok ? 'live' : 'offline'}
        </span>
      </div>
      {live.length > 0 ? (
        <ul className="space-y-1.5">
          {live.map((s) => (
            <li key={s.id} className="text-sm text-zinc-300 flex items-center justify-between gap-3">
              <span className="truncate">{s.displayName || s.name || s.id}</span>
              <span className="text-zinc-500 shrink-0">
                {s.activity?.state || s.status || 'active'} · {s.harness || 'ao'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500 leading-relaxed">
          AO Board is for pull requests, not sessions. Sessions show in the AO sidebar and here.
          Run an analysis to spawn a named coding worker.
        </p>
      )}
    </div>
  );
}
