'use client';

// ============================================================
// Understanding Display Component
// ============================================================
// Shows the visible Understanding phase after goal parsing.
// Displays extracted objective, domain, geography, constraints,
// and required analysis in a clean, progressive reveal format.
// ============================================================

import { Check, Loader2 } from 'lucide-react';
import type { UnderstandingPhase } from '@/lib/architect/goal-parser';

interface UnderstandingDisplayProps {
  understanding: UnderstandingPhase;
  onReadyToProceed?: () => void;
}

export function UnderstandingDisplay({ understanding, onReadyToProceed }: UnderstandingDisplayProps) {
  const { steps, extracted, status, readyToArchitect } = understanding;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {status === 'analyzing' ? (
          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
        ) : (
          <Check className="w-5 h-5 text-emerald-400" />
        )}
        <h2 className="text-lg font-medium text-white">
          {status === 'analyzing' ? 'Understanding Your Goal...' : 'Goal Understood'}
        </h2>
      </div>

      {/* Steps Checklist */}
      <div className="space-y-2 text-sm">
        <StepItem completed={steps.goalIdentified} label="Goal identified" />
        <StepItem completed={steps.domainIdentified} label="Domain identified" />
        <StepItem completed={steps.geographyIdentified} label="Geography identified" />
        <StepItem completed={steps.constraintsExtracted} label="Constraints extracted" />
        <StepItem completed={steps.successCriteriaGenerated} label="Success criteria generated" />
      </div>

      {/* Extracted Information */}
      {status === 'completed' && (
        <div className="space-y-6 bg-[#111116] border border-[#24242C] rounded-lg p-6">
          {/* Objective */}
          <Section title="Objective" confidence={null}>
            <p className="text-white font-medium">{extracted.primaryObjective}</p>
          </Section>

          {/* Domain */}
          <Section title="Domain" confidence={extracted.domainConfidence}>
            <p className="text-gray-300">{extracted.domain}</p>
          </Section>

          {/* Geography */}
          <Section title="Geography" confidence={extracted.geographyConfidence}>
            <p className="text-gray-300">{extracted.geography}</p>
          </Section>

          {/* Target Users */}
          <Section title="Target Users" confidence={extracted.targetUsersConfidence}>
            <p className="text-gray-300">{extracted.targetUsers}</p>
          </Section>

          {/* Required Analysis */}
          <Section title="Required Analysis" confidence={null}>
            <ul className="space-y-1.5">
              {extracted.requiredAnalysis.map((item, i) => (
                <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Inferred Constraints */}
          <Section title="Inferred Constraints" confidence={null}>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <ConstraintItem
                label="Budget"
                value={`$${extracted.constraints.budget?.value.toFixed(2)}`}
                source={extracted.constraints.budget?.source}
              />
              <ConstraintItem
                label="Deadline"
                value={`${extracted.constraints.deadline?.value}s`}
                source={extracted.constraints.deadline?.source}
              />
              <ConstraintItem
                label="Quality Target"
                value={`${(extracted.constraints.reliability?.value ?? 0.9) * 100}%`}
                source={extracted.constraints.reliability?.source}
              />
            </div>
          </Section>
        </div>
      )}

      {/* Ready to Architect */}
      {readyToArchitect && (
        <div className="flex items-center justify-between bg-[#111116] border border-emerald-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">Task specification ready</span>
          </div>
          {onReadyToProceed && (
            <button
              onClick={onReadyToProceed}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Build Architecture →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Supporting Components

function StepItem({ completed, label }: { completed: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {completed ? (
        <Check className="w-4 h-4 text-emerald-400" />
      ) : (
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
      )}
      <span className={`text-sm ${completed ? 'text-gray-300' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}

function Section({
  title,
  confidence,
  children,
}: {
  title: string;
  confidence: 'high' | 'medium' | 'low' | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">{title}</h3>
        {confidence && <ConfidenceBadge level={confidence} />}
      </div>
      {children}
    </div>
  );
}

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${colors[level]}`}>
      {level} confidence
    </span>
  );
}

function ConstraintItem({
  label,
  value,
  source,
}: {
  label: string;
  value: string;
  source?: 'explicit' | 'default';
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <p className="text-xs text-gray-500">{label}</p>
        {source === 'default' && (
          <span className="text-xs text-gray-600">(default)</span>
        )}
      </div>
      <p className="text-white font-medium">{value}</p>
    </div>
  );
}
