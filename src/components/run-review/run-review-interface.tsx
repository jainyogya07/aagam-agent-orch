'use client';

// ============================================================
// Run Review Interface Component
// ============================================================
// Comprehensive inspection interface for completed runs.
// Shows: Overview, Architecture, Agents, Sessions, Evidence,
// Decisions, Metrics, Evolution, Timeline.
// Designed for judges/reviewers to inspect the machinery.
// ============================================================

import { useState } from 'react';
import { 
  LayoutGrid, 
  GitBranch, 
  Users, 
  Database,
  FileSearch,
  GitCompare,
  BarChart3,
  Clock,
  ChevronRight,
  ExternalLink,
  Download,
} from 'lucide-react';
import type { DetailedRun } from '@/lib/history/history-service';

interface RunReviewInterfaceProps {
  runId: string;
  detailedRun: DetailedRun | null;
  onClose?: () => void;
}

type TabId = 'overview' | 'architecture' | 'agents' | 'sessions' | 'evidence' | 'decisions' | 'metrics' | 'evolution' | 'timeline';

export function RunReviewInterface({ runId, detailedRun, onClose }: RunReviewInterfaceProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  if (!detailedRun) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0B0B0F]">
        <div className="text-center space-y-3">
          <div className="text-sm text-gray-500">Loading run details...</div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as TabId, label: 'Overview', icon: LayoutGrid },
    { id: 'architecture' as TabId, label: 'Architecture', icon: GitBranch },
    { id: 'agents' as TabId, label: 'Agents', icon: Users },
    { id: 'sessions' as TabId, label: 'Sessions', icon: Database },
    { id: 'evidence' as TabId, label: 'Evidence', icon: FileSearch },
    { id: 'decisions' as TabId, label: 'Decisions', icon: GitCompare },
    { id: 'metrics' as TabId, label: 'Metrics', icon: BarChart3 },
    { id: 'evolution' as TabId, label: 'Evolution', icon: GitCompare },
    { id: 'timeline' as TabId, label: 'Timeline', icon: Clock },
  ];

  return (
    <div className="h-full flex flex-col bg-[#0B0B0F]">
      {/* Header */}
      <div className="border-b border-[#24242C] bg-[#111116]">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold text-white mb-1">Run Review</h1>
              <p className="text-sm text-gray-400 line-clamp-1">
                {detailedRun.summary.goal}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {/* Export report */}}
                className="px-3 py-1.5 bg-[#18181f] hover:bg-[#1f1f28] border border-[#24242C] rounded-lg text-sm text-gray-400 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 bg-[#18181f] hover:bg-[#1f1f28] border border-[#24242C] rounded-lg text-sm text-gray-400 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-5 gap-3">
            <QuickStat
              label="Quality"
              value={`${((detailedRun.summary.quality ?? 0) * 100).toFixed(1)}%`}
              color="text-emerald-400"
            />
            <QuickStat
              label="Cost"
              value={`$${detailedRun.summary.cost.toFixed(3)}`}
              color="text-white"
            />
            <QuickStat
              label="Version"
              value={`V${detailedRun.summary.finalVersion}`}
              color="text-violet-400"
            />
            <QuickStat
              label="Agents"
              value={`${detailedRun.summary.agentCount}`}
              color="text-blue-400"
            />
            <QuickStat
              label="Sessions"
              value={`${detailedRun.summary.sessionCount}`}
              color="text-amber-400"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-violet-500 text-violet-400'
                    : 'border-transparent text-gray-500 hover:text-gray-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && <OverviewTab detailedRun={detailedRun} />}
        {activeTab === 'architecture' && <ArchitectureTab detailedRun={detailedRun} />}
        {activeTab === 'agents' && <AgentsTab detailedRun={detailedRun} />}
        {activeTab === 'sessions' && <SessionsTab detailedRun={detailedRun} />}
        {activeTab === 'evidence' && <EvidenceTab />}
        {activeTab === 'decisions' && <DecisionsTab />}
        {activeTab === 'metrics' && <MetricsTab detailedRun={detailedRun} />}
        {activeTab === 'evolution' && <EvolutionTab detailedRun={detailedRun} />}
        {activeTab === 'timeline' && <TimelineTab detailedRun={detailedRun} />}
      </div>
    </div>
  );
}

// Supporting Components

function QuickStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#0B0B0F] border border-[#24242C] rounded-lg p-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
    </div>
  );
}

// Tab Components

function OverviewTab({ detailedRun }: { detailedRun: DetailedRun }) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Task Specification */}
      <Section title="Task Specification">
        <InfoGrid>
          <InfoItem label="Objective" value={detailedRun.taskSpec.objective} />
          <InfoItem label="Domain" value={detailedRun.taskSpec.domain} />
          <InfoItem label="Geography" value={detailedRun.taskSpec.geography} />
          <InfoItem label="Target Users" value={detailedRun.taskSpec.targetUsers} />
        </InfoGrid>
        
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-400 mb-2">Required Analysis</div>
          <div className="flex flex-wrap gap-2">
            {detailedRun.taskSpec.requiredAnalysis.map((item, i) => (
              <span key={i} className="px-2 py-1 bg-[#111116] border border-[#24242C] rounded text-xs text-gray-300">
                {item}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* Constraints */}
      <Section title="Constraints">
        <InfoGrid cols={3}>
          <InfoItem label="Budget" value={`$${detailedRun.taskSpec.constraints.budget.toFixed(2)}`} />
          <InfoItem label="Deadline" value={`${detailedRun.taskSpec.constraints.deadline}s`} />
          <InfoItem label="Quality Target" value={`${(detailedRun.taskSpec.constraints.reliability * 100).toFixed(0)}%`} />
        </InfoGrid>
      </Section>

      {/* Final Output */}
      <Section title="Final Output">
        <div className="bg-[#111116] border border-[#24242C] rounded-lg p-4">
          <p className="text-sm text-gray-300 whitespace-pre-wrap">
            {detailedRun.finalAnswer || 'No output available'}
          </p>
        </div>
      </Section>

      {/* Stop Reason */}
      {detailedRun.stopReason && (
        <Section title="Stop Reason">
          <div className="text-sm text-gray-400">{detailedRun.stopReason}</div>
        </Section>
      )}
    </div>
  );
}

function ArchitectureTab({ detailedRun }: { detailedRun: DetailedRun }) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Section title="Architecture Evolution">
        <div className="space-y-4">
          {detailedRun.architectures.map((arch, index) => (
            <div key={index} className="bg-[#111116] border border-[#24242C] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-violet-500/10 text-violet-400 text-sm font-semibold rounded border border-violet-500/20">
                    V{arch.version}
                  </span>
                  <span className="text-sm text-gray-400">
                    {arch.nodeCount} agents
                  </span>
                </div>
                {arch.quality && (
                  <span className="text-sm text-emerald-400">
                    Quality: {(arch.quality * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              {arch.mutationReason && (
                <div className="text-sm text-gray-500 italic">
                  Mutation: {arch.mutationReason}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function AgentsTab({ detailedRun }: { detailedRun: DetailedRun }) {
  return (
    <div className="max-w-5xl mx-auto">
      <Section title="Agent Executions">
        <div className="text-sm text-gray-500">
          Agent execution details would be displayed here with their sessions, tool calls, and outputs.
        </div>
      </Section>
    </div>
  );
}

function SessionsTab({ detailedRun }: { detailedRun: DetailedRun }) {
  return (
    <div className="max-w-5xl mx-auto">
      <Section title="Session Hierarchy">
        <div className="space-y-2">
          <div className="text-sm font-medium text-white mb-3">
            Total Sessions: {detailedRun.summary.sessionCount}
          </div>
          <div className="bg-[#111116] border border-[#24242C] rounded-lg p-4 text-sm text-gray-500">
            Session hierarchy and context isolation details would be displayed here.
          </div>
        </div>
      </Section>
    </div>
  );
}

function EvidenceTab() {
  return (
    <div className="max-w-5xl mx-auto">
      <Section title="Evidence & Verification">
        <div className="text-sm text-gray-500">
          Claims, evidence items, verification status, and citations would be displayed here.
        </div>
      </Section>
    </div>
  );
}

function DecisionsTab() {
  return (
    <div className="max-w-5xl mx-auto">
      <Section title="Decision Provenance">
        <div className="text-sm text-gray-500">
          Resource allocation decisions, mutation decisions, and their reasoning would be displayed here.
        </div>
      </Section>
    </div>
  );
}

function MetricsTab({ detailedRun }: { detailedRun: DetailedRun }) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Quality Breakdown */}
      {detailedRun.qualityBreakdown && (
        <Section title="Quality Breakdown">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(detailedRun.qualityBreakdown).map(([dim, score]) => (
              <div key={dim} className="bg-[#111116] border border-[#24242C] rounded-lg p-3">
                <div className="text-sm text-gray-400 capitalize mb-2">{dim}</div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-white">
                    {(score * 100).toFixed(0)}%
                  </div>
                  <div className="flex-1 bg-[#0B0B0F] rounded-full h-2">
                    <div
                      className="bg-violet-500 h-2 rounded-full"
                      style={{ width: `${score * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Resource Usage */}
      <Section title="Resource Usage">
        <InfoGrid cols={4}>
          <InfoItem label="Total Budget" value={`$${detailedRun.resources.totalBudget.toFixed(2)}`} />
          <InfoItem label="Total Spent" value={`$${detailedRun.resources.totalSpent.toFixed(3)}`} />
          <InfoItem label="Reclaimed" value={`$${detailedRun.resources.totalReclaimed.toFixed(3)}`} />
          <InfoItem label="Efficiency" value={`${detailedRun.resources.efficiency.toFixed(2)}`} />
        </InfoGrid>
      </Section>
    </div>
  );
}

function EvolutionTab({ detailedRun }: { detailedRun: DetailedRun }) {
  if (detailedRun.architectures.length <= 1) {
    return (
      <div className="max-w-5xl mx-auto">
        <Section title="Architecture Evolution">
          <div className="text-sm text-gray-500">
            No architecture mutations occurred for this run.
          </div>
        </Section>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Section title="V1 → V{detailedRun.summary.finalVersion} Evolution">
        <div className="space-y-4">
          {detailedRun.architectures.slice(0, -1).map((arch, index) => {
            const nextArch = detailedRun.architectures[index + 1];
            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-[#111116] border border-[#24242C] rounded-lg p-4">
                    <div className="text-sm font-medium text-white mb-2">V{arch.version}</div>
                    <div className="text-sm text-gray-400">
                      Quality: {arch.quality ? `${(arch.quality * 100).toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-violet-400" />
                  <div className="flex-1 bg-[#111116] border border-violet-500/30 rounded-lg p-4">
                    <div className="text-sm font-medium text-white mb-2">V{nextArch.version}</div>
                    <div className="text-sm text-gray-400">
                      Quality: {nextArch.quality ? `${(nextArch.quality * 100).toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                </div>
                {nextArch.mutationReason && (
                  <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-3 text-sm text-gray-400">
                    <span className="font-medium text-violet-400">Reason:</span> {nextArch.mutationReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function TimelineTab({ detailedRun }: { detailedRun: DetailedRun }) {
  return (
    <div className="max-w-3xl mx-auto">
      <Section title="Execution Timeline">
        <div className="space-y-3">
          <TimelineEvent
            time="00:00"
            label="Task Created"
            description={detailedRun.summary.goal.slice(0, 80)}
          />
          <TimelineEvent
            time="00:02"
            label="Architecture V1 Generated"
            description={`${detailedRun.architectures[0]?.nodeCount || 0} agents selected`}
          />
          {detailedRun.architectures.length > 1 && (
            <TimelineEvent
              time="00:35"
              label={`Architecture V${detailedRun.summary.finalVersion} Generated`}
              description="Quality gate triggered mutation"
            />
          )}
          <TimelineEvent
            time={`${Math.floor(detailedRun.summary.durationMs / 1000)}s`}
            label="Run Completed"
            description={`Final quality: ${((detailedRun.summary.quality ?? 0) * 100).toFixed(1)}%`}
          />
        </div>
      </Section>
    </div>
  );
}

function TimelineEvent({ time, label, description }: { time: string; label: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-2 h-2 bg-violet-400 rounded-full" />
        <div className="w-px flex-1 bg-[#24242C] my-1" />
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xs text-gray-600">{time}</span>
          <span className="text-sm font-medium text-white">{label}</span>
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}

// Utility Components

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">{title}</h2>
      {children}
    </div>
  );
}

function InfoGrid({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return (
    <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm text-white">{value}</div>
    </div>
  );
}
