'use client';

import { ArrowRight, Loader2, Check } from 'lucide-react';
import type { Architecture } from '@/lib/types/architecture';
import type { AgentContribution } from '@/lib/analysis/demo-run';

interface InlineWorkflowProps {
  architecture: Architecture;
  contributions?: AgentContribution[];
  phase: 'architecting' | 'executing' | 'quality-gate' | 'completed';
}

export function InlineWorkflow({ architecture, contributions, phase }: InlineWorkflowProps) {
  const specialists = architecture.nodes.filter((n) => n.role !== 'synthesizer');
  const synthesizer = architecture.nodes.find((n) => n.role === 'synthesizer') ?? architecture.nodes.at(-1);

  return (
    <div className="glass-card rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] text-zinc-400 mb-1">Generated workflow</p>
          <h2 className="text-sm font-semibold tracking-tight">Architecture V{architecture.version}</h2>
          <p className="text-[11px] text-zinc-400 mt-1">
            {architecture.nodes.length} agents · ${architecture.resourcePolicy.totalBudget.toFixed(2)} budget · parallel where independent
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full border border-white/15 bg-white/5">
          {phase === 'architecting' ? 'Designing' : phase === 'executing' ? 'Running' : 'Ready'}
        </span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[720px] flex items-stretch gap-4">
          <WorkflowLane title="Understand" subtitle="Goal → TaskSpec" done={phase !== 'architecting'} />
          <Connector />
          <div className="flex-1 grid grid-cols-2 gap-3">
            {specialists.map((node) => {
              const contrib = contributions?.find((c) => c.agentId === node.id);
              const running = phase === 'executing' && !contrib;
              const done = Boolean(contrib) || phase === 'quality-gate' || phase === 'completed';
              return (
                <div key={node.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-semibold">{node.name}</h3>
                    {running ? (
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
                    ) : done ? (
                      <Check className="w-4 h-4 text-zinc-200" />
                    ) : null}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{node.objective}</p>
                  <div className="flex items-center justify-between text-sm text-zinc-500 pt-1">
                    <span>{node.model}</span>
                    <span>${node.resourceBudget.maxCost.toFixed(2)}</span>
                  </div>
                  {contrib && (
                    <p className="text-sm text-zinc-300 pt-1 border-t border-white/8">
                      Contribution {(contrib.contribution * 100).toFixed(0)}% · {contrib.summary}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <Connector />
          {synthesizer && (
            <div className="w-56 shrink-0 rounded-xl border border-white/15 bg-white/[0.06] p-4 flex flex-col justify-center space-y-2">
              <p className="text-sm text-zinc-400">Synthesize</p>
              <h3 className="text-lg font-semibold leading-snug">{synthesizer.name}</h3>
              <p className="text-sm text-zinc-400">{synthesizer.objective}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkflowLane({ title, subtitle, done }: { title: string; subtitle: string; done: boolean }) {
  return (
    <div className="w-44 shrink-0 rounded-xl border border-white/10 bg-white/[0.035] p-4 flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-2">
        {done ? <Check className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-zinc-400">{subtitle}</p>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex items-center text-zinc-500">
      <ArrowRight className="w-5 h-5" />
    </div>
  );
}
