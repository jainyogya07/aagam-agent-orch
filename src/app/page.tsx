'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  History,
  Layers,
  Plus,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { AnalysisReport, type AnalysisPhase } from '@/components/analysis/analysis-report';
import { InlineWorkflow } from '@/components/analysis/inline-workflow';
import { HistoryPanel } from '@/components/history/history-panel';
import { BenchmarkDashboard } from '@/components/benchmark/benchmark-dashboard';
import { MetricsBar, type MetricsData } from '@/components/metrics/metrics-bar';
import { GoalParser, type TaskSpec } from '@/lib/architect/goal-parser';
import {
  buildAgentContributions,
  buildDemoArchitecture,
  buildDemoSynthesis,
  type AgentContribution,
  type AnalysisSynthesis,
} from '@/lib/analysis/demo-run';
import { buildQualityFromGoal } from '@/lib/analysis/score-from-goal';
import { AmbientStage } from '@/components/bits/ambient-stage';
import { Aurora } from '@/components/bits/aurora';
import { ClickSpark } from '@/components/bits/click-spark';
import { StarBorder } from '@/components/bits/star-border';
import { FeatureRail } from '@/components/features/feature-rail';
import type { AOLiveState } from '@/components/ao/ao-live-panel';
import type { QualityGateResult } from '@/lib/types/claims';
import type { UnderstandingPhase } from '@/lib/architect/goal-parser';
import type { Architecture } from '@/lib/types/architecture';
import { HeaderTools } from '@/components/shell/header-tools';
import { VoiceButton } from '@/components/voice/voice-button';
import { SessionLayers, type TraceRun } from '@/components/sessions/session-layers';
import { SplitReveal } from '@/components/bits/split-reveal';
import { Magnet } from '@/components/bits/magnet';
import { exportAnalysisPdf } from '@/lib/export/analysis-pdf';
import { ProblemCards } from '@/components/problems/problem-cards';
import { SplashGate } from '@/components/intro/splash-gate';
import type { ProblemCard } from '@/lib/analysis/problem-catalog';
import type { AoSessionLite } from '@/components/ao/ao-presence';

type View = 'orchestrator' | 'workflow' | 'benchmark' | 'history';
type Phase = 'idle' | AnalysisPhase;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [goalInput, setGoalInput] = useState('');
  const [submittedGoal, setSubmittedGoal] = useState('');
  const [taskSpec, setTaskSpec] = useState<TaskSpec | null>(null);
  const [understanding, setUnderstanding] = useState<UnderstandingPhase | null>(null);
  const [architecture, setArchitecture] = useState<Architecture | null>(null);
  const [architectureV1, setArchitectureV1] = useState<Architecture | null>(null);
  const [architectureV2, setArchitectureV2] = useState<Architecture | null>(null);
  const [contributions, setContributions] = useState<AgentContribution[]>([]);
  const [qualityResult, setQualityResult] = useState<QualityGateResult | null>(null);
  const [v1Quality, setV1Quality] = useState<QualityGateResult | null>(null);
  const [v2Quality, setV2Quality] = useState<QualityGateResult | null>(null);
  const [v1Contributions, setV1Contributions] = useState<AgentContribution[]>([]);
  const [aoState, setAoState] = useState<AOLiveState | null>(null);
  const [aoPolling, setAoPolling] = useState(false);
  const [aoSessions, setAoSessions] = useState<AoSessionLite[]>([]);
  const [aoDaemonOk, setAoDaemonOk] = useState(false);
  const [traces, setTraces] = useState<TraceRun[]>([]);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [synthesis, setSynthesis] = useState<AnalysisSynthesis | null>(null);
  const [metrics, setMetrics] = useState<MetricsData>({
    quality: null,
    reliability: null,
    confidence: null,
    cost: 0,
    agents: 0,
    sessions: 0,
    version: 1,
  });
  const [activeView, setActiveView] = useState<View>('orchestrator');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [entered, setEntered] = useState(false);
  const runToken = useRef(0);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch('/api/ao/status');
        const data = await res.json();
        if (!alive) return;
        const sessions = (Array.isArray(data.sessions) ? data.sessions : []) as AoSessionLite[];
        setAoSessions(sessions);
        setAoDaemonOk(data.daemon?.status === 'ok');
        const match = aoState?.sessionId
          ? sessions.find((s) => s.id === aoState.sessionId)
          : null;
        if (match) {
          setAoState((prev) =>
            prev
              ? {
                  ...prev,
                  ok: true,
                  fake: false,
                  status: match.activity?.state || match.status,
                  harness: match.harness || prev.harness,
                }
              : prev
          );
        }
      } catch {
        /* keep last honest state */
      }
    };
    tick();
    const id = setInterval(tick, 4000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [aoState?.sessionId]);

  useEffect(() => {
    fetch('/api/history?limit=8')
      .then((r) => r.json())
      .then((d) => {
        const runs = Array.isArray(d.runs) ? d.runs : [];
        setTraces(
          runs.map((r: { runId: string; goal: string; quality?: number; reliability?: number; aoSessionId?: string }) => ({
            runId: r.runId,
            goal: r.goal,
            quality: r.quality,
            reliability: r.reliability,
            aoSessionId: r.aoSessionId,
          }))
        );
      })
      .catch(() => {
        /* traces stay empty */
      });
  }, []);

  const resetAnalysis = () => {
    runToken.current += 1;
    setPhase('idle');
    setGoalInput('');
    setSubmittedGoal('');
    setTaskSpec(null);
    setArchitecture(null);
    setArchitectureV1(null);
    setArchitectureV2(null);
    setContributions([]);
    setQualityResult(null);
    setV1Quality(null);
    setV2Quality(null);
    setV1Contributions([]);
    setAoState(null);
    setAoPolling(false);
    setSelectedPrompt(null);
    setSynthesis(null);
    setMetrics({
      quality: null,
      reliability: null,
      confidence: null,
      cost: 0,
      agents: 0,
      sessions: 0,
      version: 1,
    });
    setCurrentRunId(null);
  };

  const handleNewWorkflow = () => {
    resetAnalysis();
    setActiveView('orchestrator');
    setTimeout(() => composerRef.current?.focus(), 80);
  };

  const handleGoalSubmit = async (raw?: string) => {
    const goal = (raw ?? goalInput).trim();
    if (!goal) return;

    const token = ++runToken.current;
    setSubmittedGoal(goal);
    setGoalInput(goal);
    setContributions([]);
    setQualityResult(null);
    setV1Quality(null);
    setV2Quality(null);
    setV1Contributions([]);
    setAoState(null);
    setSynthesis(null);
    setArchitecture(null);
    setArchitectureV1(null);
    setArchitectureV2(null);
    setUnderstanding(null);
    setTaskSpec(null);
    setCurrentRunId(`run_${token}`);

    setPhase('understanding');
    await delay(500);
    if (token !== runToken.current) return;

    const spec = GoalParser.parse(goal);
    setTaskSpec(spec);
    setUnderstanding(spec.understanding);

    setPhase('architecting');
    await delay(600);
    if (token !== runToken.current) return;

    const archV1 = buildDemoArchitecture(spec, `run_${token}`, 1);
    setArchitecture(archV1);
    setArchitectureV1(archV1);
    setArchitectureV2(null);
    setMetrics({
      quality: null,
      reliability: null,
      confidence: null,
      cost: 0,
      agents: archV1.nodes.length,
      sessions: Math.max(1, aoSessions.filter((s) => !s.isTerminated).length),
      version: 1,
    });

    setPhase('executing');
    setAoPolling(true);
    const coding = fetch('/api/ao/coding-run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId: `run_${token}`,
        name: 'AAGAM-code',
        instruction: `Technical slice for: ${goal.slice(0, 280)}\n\nIn an isolated AO worktree, implement a small TypeScript CODE artifact that the AAGAM verifier can score: unit-economics helpers (LTV, CAC, paybackMonths) plus a boolean clearsPayback(ltv, cac, months=12). Do not invent TAM figures.`,
      }),
    })
      .then(async (res) => (await res.json()) as AOLiveState)
      .then((data) => {
        setAoState({ ...data, fake: false });
        return data;
      })
      .catch((err) => {
        const failed: AOLiveState = {
          ok: false,
          fake: false,
          error: err instanceof Error ? err.message : 'AO request failed',
        };
        setAoState(failed);
        return failed;
      });

    await delay(900);
    if (token !== runToken.current) return;

    const contribV1 = buildAgentContributions(archV1);
    setV1Contributions(contribV1);
    setContributions(contribV1);
    const q1 = buildQualityFromGoal(goal, 1);
    setV1Quality(q1);
    setV2Quality(null);
    setQualityResult(q1);
    setMetrics((prev) => ({
      ...prev,
      cost: contribV1.reduce((sum, c) => sum + c.cost, 0),
      quality: q1.overallScore,
      reliability: q1.dimensions.consistency,
      confidence: q1.evidenceCoverageRatio,
      version: 1,
      qualityBreakdown: q1.dimensions,
    }));

    setPhase('quality-gate');
    await delay(700);
    if (token !== runToken.current) return;

    await coding;
    setAoPolling(false);

    const shouldMutate = q1.overallScore < 0.9 || contribV1.some((c) => c.contribution < 0.08);
    let finalQuality = q1;
    let finalContrib = contribV1;
    let finalVersion: 1 | 2 = 1;
    let finalCost = contribV1.reduce((sum, c) => sum + c.cost, 0);
    if (shouldMutate) {
      const archV2 = buildDemoArchitecture(spec, `run_${token}`, 2);
      setArchitecture(archV2);
      setArchitectureV2(archV2);
      const contribV2 = buildAgentContributions(archV2);
      setContributions(contribV2);
      const q2 = buildQualityFromGoal(goal, 2);
      setV2Quality(q2);
      setQualityResult(q2);
      finalQuality = q2;
      finalContrib = contribV2;
      finalVersion = 2;
      finalCost = contribV2.reduce((sum, c) => sum + c.cost, 0);
      setMetrics({
        quality: q2.overallScore,
        reliability: q2.dimensions.consistency,
        confidence: q2.evidenceCoverageRatio,
        cost: finalCost,
        agents: archV2.nodes.length,
        sessions: Math.max(1, aoSessions.filter((s) => !s.isTerminated).length),
        version: 2,
        qualityBreakdown: q2.dimensions,
      });
    }

    const synth = buildDemoSynthesis(spec);
    setSynthesis(synth);
    setPhase('completed');

    void fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId: `run_${token}`,
        goal,
        domain: spec.domain,
        geography: spec.geography,
        quality: finalQuality.overallScore,
        reliability: finalQuality.dimensions.consistency,
        confidence: finalQuality.evidenceCoverageRatio,
        cost: finalCost,
        version: finalVersion,
        memo: `${synth.verdict}\n\n${synth.verdictDetail}`,
        dimensions: finalQuality.dimensions,
        agents: finalContrib.map((c) => ({
          agentName: c.name,
          model: c.role,
          cost: c.cost,
        })),
      }),
    }).catch(() => undefined);
  };

  const handleSelectCard = (card: ProblemCard) => {
    setSelectedPrompt(card.id);
    setGoalInput(card.prompt);
  };

  const stillRunning = phase !== 'idle' && phase !== 'completed';

  const headerTools = (
    <HeaderTools
      aoLabel={aoDaemonOk ? `AO · ${aoSessions.filter((s) => !s.isTerminated).length} live` : 'AO'}
      aoOk={aoDaemonOk}
      aoSessions={aoSessions}
      neatlogsUrl="https://app.neatlogs.com"
      onExportPdf={() =>
        exportAnalysisPdf({
          goal: submittedGoal || goalInput,
          understanding,
          synthesis,
          qualityResult,
        })
      }
    />
  );

  if (!entered) {
    return (
      <SplashGate
        onEnter={() => {
          setEntered(true);
        }}
      />
    );
  }

  return (
    <ClickSpark sparkColor="#f4f4f5" sparkCount={14} sparkRadius={26}>
    <div className="h-screen app-shell text-zinc-100 flex overflow-hidden relative">
      <AmbientStage />
      <aside
        className={`relative z-10 border-r border-white/10 bg-black/50 backdrop-blur-xl transition-all duration-300 flex flex-col ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="h-20 flex items-center justify-between px-4 pt-2 border-b border-white/10">
          {!sidebarCollapsed && (
            <button type="button" onClick={() => setEntered(false)} className="text-left">
              <div className="text-base font-semibold tracking-wide">AAGAM</div>
              <div className="text-sm text-zinc-500">Give us a problem, not a workflow</div>
            </button>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-400"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <NavButton
            active={activeView === 'orchestrator'}
            collapsed={sidebarCollapsed}
            icon={<Sparkles className="w-4 h-4" />}
            label="New analysis"
            onClick={() => setActiveView('orchestrator')}
          />
          <NavButton
            active={activeView === 'workflow'}
            collapsed={sidebarCollapsed}
            icon={<Layers className="w-4 h-4" />}
            label="Workflows"
            onClick={() => setActiveView('workflow')}
          />
          <NavButton
            active={activeView === 'benchmark'}
            collapsed={sidebarCollapsed}
            icon={<ShieldCheck className="w-4 h-4" />}
            label="Proofs"
            onClick={() => setActiveView('benchmark')}
          />
          <NavButton
            active={activeView === 'history'}
            collapsed={sidebarCollapsed}
            icon={<History className="w-4 h-4" />}
            label="History"
            onClick={() => setActiveView('history')}
          />
        </nav>

        {!sidebarCollapsed && (
          <div className="p-3 border-t border-white/10 space-y-3">
            <button
              onClick={handleNewWorkflow}
              className="btn-solid w-full py-2 px-3 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New workflow
            </button>
            <p className="text-sm text-zinc-500 px-1">
              Starts a fresh analysis. The system designs the workflow from your goal.
            </p>
          </div>
        )}
      </aside>

      <main className="relative z-10 flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <header className="min-h-16 border-b border-white/10 bg-black/30 backdrop-blur-xl flex items-center justify-between gap-4 px-6 py-2">
          <div className="text-sm text-zinc-300 min-w-0">
            {activeView === 'benchmark' && 'Proofs · 110 tasks'}
            {activeView === 'workflow' && 'Workflow from your last goal'}
            {activeView === 'history' && 'History · readable run records'}
            {activeView === 'orchestrator' && phase === 'idle' && 'Write a problem'}
            {activeView === 'orchestrator' && phase !== 'idle' && (
              <span className="capitalize">{phase.replace('-', ' ')}</span>
            )}
          </div>
          {headerTools}
        </header>
        {activeView === 'orchestrator' && phase !== 'idle' && (
          <div className="border-b border-white/10 bg-black/40 px-6 py-2">
            <MetricsBar
              metrics={metrics}
              phase={phase === 'completed' ? 'completed' : 'running'}
            />
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8">
          <AnimatePresence mode="wait">
            {activeView === 'workflow' ? (
              <motion.div
                key="workflow"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="max-w-6xl mx-auto space-y-6"
              >
                {architecture ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h1 className="text-3xl font-semibold">Current workflow</h1>
                        <p className="text-base text-zinc-400 mt-1">
                          Built from your goal. Agents, tools, and budgets were chosen by the orchestrator.
                        </p>
                      </div>
                      <button onClick={handleNewWorkflow} className="btn-solid px-4 py-2.5 rounded-xl text-base">
                        New workflow
                      </button>
                    </div>
                    <InlineWorkflow
                      architecture={architecture}
                      contributions={contributions}
                      phase={phase === 'idle' ? 'completed' : phase === 'understanding' ? 'architecting' : phase}
                    />
                    {architectureV1 && architectureV2 && architectureV1.id !== architectureV2.id && (
                      <InlineWorkflow
                        architecture={architectureV1}
                        contributions={v1Contributions}
                        phase="completed"
                      />
                    )}
                  </>
                ) : (
                  <div className="glass-card rounded-2xl p-10 max-w-2xl mx-auto text-center space-y-4">
                    <h1 className="text-3xl font-semibold">No workflow yet</h1>
                    <p className="text-lg text-zinc-400 leading-relaxed">
                      You do not pick agents or tools. Describe the problem — AAGAM designs the workflow.
                    </p>
                    <button onClick={handleNewWorkflow} className="btn-solid px-5 py-3 rounded-xl text-base inline-flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      New workflow
                    </button>
                  </div>
                )}
              </motion.div>
            ) : activeView === 'history' ? (
              <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <HistoryPanel />
              </motion.div>
            ) : activeView === 'benchmark' ? (
              <motion.div key="benchmark" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <BenchmarkDashboard />
              </motion.div>
            ) : (
              <motion.div key="orchestrator" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {phase === 'idle' ? (
                  <div className="max-w-4xl mx-auto space-y-8 pb-16">
                    <div className="text-center space-y-2">
                      <p className="text-sm tracking-wide text-zinc-400 uppercase">Give us a problem, not a workflow</p>
                      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-50">
                        <SplitReveal text="AAGAM" />
                      </h1>
                      <p className="text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
                        Write the problem in ordinary English. The system decides who should work, what they may spend, and whether the setup should change.
                      </p>
                    </div>
                    <StarBorder className="rounded-2xl">
                      <div className="relative overflow-hidden rounded-2xl p-3 md:p-4 space-y-3 bg-zinc-950 border border-white/10">
                        <div className="absolute inset-0 pointer-events-none opacity-50">
                          <Aurora colorStops={['#e4e4e7', '#71717a', '#fafafa']} amplitude={0.85} blend={0.7} speed={0.55} />
                        </div>
                        <textarea
                          ref={composerRef}
                          value={goalInput}
                          onChange={(e) => setGoalInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGoalSubmit();
                          }}
                          placeholder="Example: I want to build an Ayurvedic MedTech platform in India. Find companies, market, costs, regulation, and whether it can scale."
                          className="relative z-10 w-full h-28 bg-transparent text-base text-white placeholder:text-zinc-500 resize-none focus:outline-none leading-relaxed"
                        />
                        <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/10">
                          <span className="text-sm text-zinc-500">⌘ + Enter · or tap Voice</span>
                          <div className="flex items-center gap-2">
                            <VoiceButton value={goalInput} onTranscript={setGoalInput} />
                            <Magnet strength={12}>
                              <button
                                onClick={() => handleGoalSubmit()}
                                disabled={!goalInput.trim()}
                                className="btn-solid px-4 py-1.5 rounded-lg text-sm inline-flex items-center gap-2"
                              >
                                Analyze
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </Magnet>
                          </div>
                        </div>
                      </div>
                    </StarBorder>
                    <ProblemCards
                      selectedId={selectedPrompt}
                      onSelect={handleSelectCard}
                      onAnalyze={(card) => {
                        handleSelectCard(card);
                        handleGoalSubmit(card.prompt);
                      }}
                    />
                    <FeatureRail />
                    <SessionLayers
                      focus="ao"
                      aoOk={aoDaemonOk}
                      aoSessions={aoSessions}
                      traces={traces}
                      currentRunId={currentRunId}
                    />
                    <SessionLayers
                      focus="neatlogs"
                      aoOk={aoDaemonOk}
                      aoSessions={aoSessions}
                      traces={traces}
                      currentRunId={currentRunId}
                    />
                  </div>
                ) : (
                <AnalysisReport
                    goal={submittedGoal}
                    phase={phase}
                    taskSpec={taskSpec}
                    understanding={understanding}
                    architecture={architecture}
                    architectureV1={architectureV1}
                    architectureV2={architectureV2}
                    contributions={contributions}
                    qualityResult={qualityResult}
                    v1Quality={v1Quality}
                    v2Quality={v2Quality}
                    v1Contributions={v1Contributions}
                    synthesis={synthesis}
                    onBack={() => {
                      if (stillRunning) {
                        runToken.current += 1;
                      }
                      setPhase('idle');
                    }}
                    onNewAnalysis={handleNewWorkflow}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
    </ClickSpark>
  );
}

function NavButton({
  active,
  collapsed,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  collapsed: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`select-none w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
        active ? 'bg-zinc-800 text-zinc-50 border border-white/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  );
}
