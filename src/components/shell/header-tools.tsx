'use client';

import { BookOpen, Code2, ExternalLink, FileDown, Heart, Radio, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { WhatWhy } from '@/components/bits/what-why';
import { ThanksPanel } from '@/components/intro/thanks-panel';
import type { AoSessionLite } from '@/components/ao/ao-presence';

const HOW_TO = [
  {
    title: '1. Open the product',
    what: 'Landing is the explanation. Go to AAGAM opens the workspace with the sidebar.',
    why: 'The dashboard is for running a problem, not for reading the manifesto twice.',
  },
  {
    title: '2. Start AO on this machine',
    what: 'Leave this tab open. Open the Agent Orchestrator desktop app so the daemon is reachable.',
    why: 'Coding sessions are live from `ao session ls`. If AO is down, AAGAM says offline — it will not invent a Board card.',
  },
  {
    title: '3. Write or speak a problem',
    what: 'Use the composer at the top. Type English, or tap Voice. Example: Ayurvedic MedTech in India — companies, market, costs, regulation, can it scale?',
    why: 'You do not pick agents, tools, or a budget. That is what Analyze does.',
  },
  {
    title: '4. Inspect a card first (optional)',
    what: 'Click a problem card to audit it before you run. Then click Analyze on that card, or submit your own text.',
    why: 'The cards are examples. After a run they also show AO sessions and Neatlogs traces for that problem.',
  },
  {
    title: '5. Click Analyze',
    what: 'Watch Understand → Architect → Execute. V1 has a loading animation while the first team is reserved. Quality scores eight dimensions.',
    why: 'V2 is not automatic theater. It appears only if changing the team is expected to pay. Otherwise we keep V1.',
  },
  {
    title: '6. Read the loop under the composer',
    what: '“What the loop does” sits under the chat box. Click a card — selected text stays readable.',
    why: 'Each card is one step you can audit without leaving the page.',
  },
  {
    title: '7. Use AO and Neatlogs on the same page',
    what: 'Compact live sessions sit near Analyze. The full AO list and full Neatlogs list are lower. Header AO is the same live feed.',
    why: 'AO executes isolated coding. Neatlogs observes traces. Neither picks the team.',
  },
  {
    title: '8. Save the decision',
    what: 'Export PDF from the header. History in the sidebar keeps past runs. Proofs is the 110-task catalog.',
    why: 'A run is a decision record: who worked, what it cost, whether the architecture changed.',
  },
];

type Panel = 'docs' | 'api' | 'ao' | 'thanks';

export function HeaderTools({
  onExportPdf,
  neatlogsUrl,
  aoLabel,
  aoOk = false,
  aoSessions = [],
}: {
  onExportPdf: () => void;
  neatlogsUrl: string;
  aoLabel?: string;
  aoOk?: boolean;
  aoSessions?: AoSessionLite[];
}) {
  const [open, setOpen] = useState<Panel | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const titles: Record<Panel, { kicker: string; title: string }> = {
    docs: { kicker: 'How to use AAGAM', title: 'Docs' },
    ao: { kicker: 'Live on this machine', title: 'Agent Orchestrator' },
    api: { kicker: 'Public surface', title: 'API' },
    thanks: { kicker: 'People and tools', title: 'Thank you' },
  };

  const modal =
    open && (
      <div
        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 md:p-10 overflow-y-auto"
        onClick={() => setOpen(null)}
      >
        <div
          className={`relative z-[201] rounded-2xl w-full p-6 md:p-8 space-y-5 my-8 border border-white/15 bg-zinc-950 text-zinc-100 ${
            open === 'thanks' || open === 'docs' ? 'max-w-5xl' : 'max-w-4xl'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-400">{titles[open].kicker}</p>
              <h2 className="text-2xl font-semibold mt-1">{titles[open].title}</h2>
            </div>
            <button type="button" onClick={() => setOpen(null)} className="p-2 rounded-lg hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>

          {open === 'docs' ? (
            <div className="space-y-4">
              <p className="text-base text-zinc-300 leading-relaxed">
                This is the operating guide. The gap and the manifesto live on the landing page — not here, and not again on the dashboard.
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                {HOW_TO.map((g) => (
                  <div key={g.title} className="rounded-xl border border-white/10 bg-zinc-900/80 p-4 space-y-3">
                    <h3 className="text-base font-semibold">{g.title}</h3>
                    <WhatWhy stacked what={g.what} why={g.why} />
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-white/10 p-4 text-sm text-zinc-400 space-y-1.5">
                <p>AO Board = pull requests. AO sidebar + this header = sessions.</p>
                <p>If V2 does not appear, expected value of change was not positive. That is a keep-V1 decision.</p>
                <p>Public API is coming soon. It is not listed in this product.</p>
              </div>
            </div>
          ) : open === 'ao' ? (
            <AoDocsPanel aoOk={aoOk} aoSessions={aoSessions} />
          ) : open === 'thanks' ? (
            <ThanksPanel />
          ) : (
            <div className="rounded-2xl border border-white/12 bg-zinc-900/70 p-10 text-center space-y-3">
              <p className="text-sm uppercase tracking-[0.22em] text-zinc-500">AAGAM API</p>
              <h3 className="text-3xl font-semibold">Coming soon</h3>
              <p className="text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
                A public API for this system is reserved. Endpoints are not published here.
              </p>
            </div>
          )}
        </div>
      </div>
    );

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <button type="button" onClick={() => setOpen('ao')} className="btn-ghost px-3 py-1.5 rounded-lg text-sm inline-flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5" />
          {aoLabel || 'AO'}
        </button>
        <button type="button" onClick={() => setOpen('docs')} className="btn-ghost px-3 py-1.5 rounded-lg text-sm inline-flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          Docs
        </button>
        <button type="button" onClick={() => setOpen('api')} className="btn-ghost px-3 py-1.5 rounded-lg text-sm inline-flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5" />
          API
        </button>
        <button type="button" onClick={() => setOpen('thanks')} className="btn-ghost px-3 py-1.5 rounded-lg text-sm inline-flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5" />
          Thank you
        </button>
        <a
          href={neatlogsUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost px-3 py-1.5 rounded-lg text-sm inline-flex items-center gap-1.5"
          title="Neatlogs observes traces. AAGAM decides. AO executes coding."
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Neatlogs
        </a>
        <button type="button" onClick={onExportPdf} className="btn-solid px-3 py-1.5 rounded-lg text-sm inline-flex items-center gap-1.5">
          <FileDown className="w-3.5 h-3.5" />
          Export PDF
        </button>
      </div>
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}

function AoDocsPanel({ aoOk, aoSessions }: { aoOk: boolean; aoSessions: AoSessionLite[] }) {
  const live = aoSessions.filter((s) => !s.isTerminated);
  const ended = aoSessions.filter((s) => s.isTerminated);
  const arch = live.filter((s) => s.role === 'orchestrator');
  const workers = live.filter((s) => s.role !== 'orchestrator');

  return (
    <div className="space-y-5">
      <WhatWhy
        stacked
        what="AO runs coding in an isolated folder. This list is live from the local daemon. Status is never faked."
        why="The Board is for pull requests. Sessions show in the AO sidebar, next to Analyze, in the full list below, and here."
      />
      <div className="grid sm:grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/10 p-3">
          <p className="text-sm text-zinc-500">Daemon</p>
          <p className="text-base font-medium">{aoOk ? 'Reachable' : 'Not reachable'}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <p className="text-sm text-zinc-500">Live sessions</p>
          <p className="text-base font-medium">{live.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <p className="text-sm text-zinc-500">Ended</p>
          <p className="text-base font-medium">{ended.length}</p>
        </div>
      </div>
      <p className="text-sm text-zinc-500">Architecture sessions {arch.length} · workers {workers.length || live.length}</p>
      {live.length === 0 ? (
        <p className="text-sm text-zinc-500">Start the AO desktop app, then Analyze.</p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-2">
          {live.map((s) => (
            <li key={s.id} className="rounded-lg border border-white/10 px-3 py-2">
              <p className="text-sm font-medium">{s.displayName || s.name || s.id}</p>
              <p className="text-sm text-zinc-500">
                {s.role === 'orchestrator' ? 'Architecture' : 'Agent'} · {s.id} · {s.activity?.state || s.status} · {s.harness || 'ao'}
              </p>
            </li>
          ))}
        </ul>
      )}
      {ended.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-400">Recently ended</p>
          <ul className="grid sm:grid-cols-2 gap-2">
            {ended.map((s) => (
              <li key={s.id} className="rounded-lg border border-white/8 px-3 py-2 opacity-70">
                <p className="text-sm font-medium">{s.displayName || s.name || s.id}</p>
                <p className="text-sm text-zinc-500">terminated · {s.id}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
