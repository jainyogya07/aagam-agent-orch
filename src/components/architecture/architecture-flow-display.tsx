'use client';

// ============================================================
// Architecture Flow Display Component
// ============================================================
// Clean visual representation of the orchestration flow:
// Goal → TaskSpec → Architecture → Agents → Quality → V2
// Shows nodes with minimal information, not giant cards.
// ============================================================

import { ArrowRight, Zap, Check, Loader2, AlertCircle } from 'lucide-react';
import type { Architecture } from '@/lib/types/architecture';

interface ArchitectureFlowDisplayProps {
  architecture: Architecture | null;
  currentPhase?: 'architecting' | 'executing' | 'quality-gate' | 'completed';
  version?: number;
}

export function ArchitectureFlowDisplay({
  architecture,
  currentPhase = 'executing',
  version = 1,
}: ArchitectureFlowDisplayProps) {
  if (!architecture) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto bg-violet-500/10 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
          <p className="text-sm text-gray-500">Building architecture...</p>
        </div>
      </div>
    );
  }

  // Extract agent nodes
  const agentNodes = architecture.nodes;

  return (
    <div className="w-full h-full overflow-auto p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Version Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Architecture
            </span>
            <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 text-xs font-semibold rounded border border-violet-500/20">
              V{version}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            {agentNodes.length} agents
          </div>
        </div>

        {/* Flow Diagram */}
        <div className="space-y-6">
          {/* Task Node */}
          <FlowNode
            title="Task"
            subtitle="User Goal"
            status="completed"
            icon="📋"
          />

          <FlowArrow />

          {/* Architecture Node */}
          <FlowNode
            title="Architecture"
            subtitle={`V${version} • ${agentNodes.length} agents`}
            status="completed"
            icon="🏗️"
          />

          <FlowArrow />

          {/* Resource Market Node */}
          <FlowNode
            title="Resource Market"
            subtitle="Capability selection & allocation"
            status={currentPhase === 'architecting' ? 'running' : 'completed'}
            icon="💰"
          />

          <FlowArrow />

          {/* Agents Grid */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Agent Execution
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {agentNodes.map((node: any) => (
                <AgentCard
                  key={node.id}
                  name={node.name}
                  role={node.role || 'Analyst'}
                  model={node.model}
                  cost={node.resourceBudget?.maxCost || 0.08}
                  status={currentPhase === 'executing' ? 'running' : 'completed'}
                />
              ))}
            </div>
          </div>

          <FlowArrow />

          {/* Evidence Node */}
          <FlowNode
            title="Evidence & Verification"
            subtitle="Claim verification • Citation checking"
            status={
              currentPhase === 'executing'
                ? 'running'
                : currentPhase === 'quality-gate' || currentPhase === 'completed'
                ? 'completed'
                : 'pending'
            }
            icon="🔍"
          />

          <FlowArrow />

          {/* Quality Gate Node */}
          <FlowNode
            title="Quality Gate"
            subtitle="8-dimensional audit • 95% threshold"
            status={
              currentPhase === 'quality-gate'
                ? 'running'
                : currentPhase === 'completed'
                ? 'completed'
                : 'pending'
            }
            icon="✓"
            highlight={currentPhase === 'quality-gate'}
          />

          {/* Evolution indicator (if V2+) */}
          {version > 1 && (
            <>
              <FlowArrow mutation />
              <FlowNode
                title="Autonomous Evolution"
                subtitle={`Mutated from V${version - 1}`}
                status="completed"
                icon="⚡"
                highlight
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Supporting Components

interface FlowNodeProps {
  title: string;
  subtitle: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  icon: string;
  highlight?: boolean;
}

function FlowNode({ title, subtitle, status, icon, highlight }: FlowNodeProps) {
  const statusColors = {
    pending: 'border-gray-700 bg-[#0B0B0F]',
    running: 'border-violet-500/50 bg-violet-500/5',
    completed: 'border-emerald-500/30 bg-emerald-500/5',
    failed: 'border-red-500/30 bg-red-500/5',
  };

  const statusIcons = {
    pending: <div className="w-5 h-5 rounded-full border-2 border-gray-700" />,
    running: <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />,
    completed: <Check className="w-5 h-5 text-emerald-400" />,
    failed: <AlertCircle className="w-5 h-5 text-red-400" />,
  };

  return (
    <div
      className={`relative border rounded-lg p-4 transition-all ${statusColors[status]} ${
        highlight ? 'ring-2 ring-violet-500/30' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {highlight && (
              <Zap className="w-3.5 h-3.5 text-violet-400" />
            )}
          </div>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className="flex-shrink-0">{statusIcons[status]}</div>
      </div>
    </div>
  );
}

function FlowArrow({ mutation }: { mutation?: boolean }) {
  return (
    <div className="flex items-center justify-center">
      <div className={`flex flex-col items-center ${mutation ? 'gap-1' : ''}`}>
        <ArrowRight
          className={`w-5 h-5 transform rotate-90 ${
            mutation ? 'text-violet-400' : 'text-gray-700'
          }`}
        />
        {mutation && (
          <span className="text-xs text-violet-400 font-medium">mutate</span>
        )}
      </div>
    </div>
  );
}

interface AgentCardProps {
  name: string;
  role: string;
  model: string;
  cost: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  aoSessionId?: string;
  harness?: string;
}

function AgentCard({ name, role, model, cost, status, aoSessionId, harness }: AgentCardProps) {
  const statusColors = {
    pending: 'border-gray-700',
    running: 'border-violet-500/50 bg-violet-500/5',
    completed: 'border-emerald-500/30',
    failed: 'border-red-500/30',
  };

  const statusDots = {
    pending: 'bg-gray-700',
    running: 'bg-violet-400 animate-pulse',
    completed: 'bg-emerald-400',
    failed: 'bg-red-400',
  };

  return (
    <div
      className={`bg-[#111116] border rounded-lg p-3 transition-all ${statusColors[status]}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate">{name}</h4>
          <p className="text-xs text-gray-500 truncate">{role}</p>
        </div>
        <div className={`w-2 h-2 rounded-full mt-1 ${statusDots[status]}`} />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span className="truncate">{model}</span>
        <span className="flex-shrink-0">${cost.toFixed(3)}</span>
      </div>
      {(aoSessionId || harness) && (
        <div className="flex items-center justify-between text-[10px] text-violet-400 mt-1.5 pt-1.5 border-t border-gray-800">
          <span>{aoSessionId ? `AO-${aoSessionId.replace(/^[a-z]+-/, '')}` : 'AO'}</span>
          <span className="capitalize">{harness || 'Worker'}</span>
        </div>
      )}
    </div>
  );
}
