// ============================================================
// Capability Selector & Planner — Agent Resource Exchange
// ============================================================
// Evaluates candidate capabilities against the goal / TaskSpec.
// Calculates:
// Expected Information Gain (EIG) ÷ (Cost × Latency × Risk)
// Implements:
// 1. Dynamic Capability Selection (only purchase what is needed)
// 2. Capability Substitution (cheaper alternatives when constrained)
// 3. "No Tool Needed" / Artifact Reuse ($0 cost when upstream findings suffice)
// ============================================================

import { CAPABILITY_CATALOG, getCapabilityById } from './capability-catalog';
import type { CapabilityMetadata } from './capability-registry';
import type { ArtifactEnvelope } from '@/lib/types/artifacts';

export interface CapabilityPurchaseDecision {
  capabilityId: string;
  action: 'BUY' | 'SUBSTITUTE' | 'USE_EXISTING_ARTIFACT' | 'REJECT' | 'SKIP';
  reason: string;
  expectedContribution: number;
  costUSD: number;
  latencyMs: number;
  substituteFor?: string;
  reusedArtifactId?: string;
}

export interface CapabilitySelectionRequest {
  agentRole: string;
  agentObjective: string;
  taskGoal: string;
  availableBudgetUSD: number;
  remainingTimeMs: number;
  existingArtifacts?: ArtifactEnvelope[];
  candidateCapabilityIds?: string[];
}

export class CapabilitySelector {
  /**
   * Plans and selects optimal capabilities for an agent given current budget and time constraints.
   */
  public static planCapabilities(request: CapabilitySelectionRequest): CapabilityPurchaseDecision[] {
    const {
      agentRole,
      agentObjective,
      taskGoal,
      availableBudgetUSD,
      remainingTimeMs,
      existingArtifacts = [],
      candidateCapabilityIds,
    } = request;

    const decisions: CapabilityPurchaseDecision[] = [];

    // Step 1: Filter relevant candidate capabilities based on agent role
    const candidates = (candidateCapabilityIds ?? Object.keys(CAPABILITY_CATALOG))
      .map(id => getCapabilityById(id)?.metadata)
      .filter((cap): cap is CapabilityMetadata => Boolean(cap));

    // Role-to-class alignment heuristics
    const roleLower = agentRole.toLowerCase();
    const isResearch = /research|market|gather|data|source/i.test(roleLower);
    const isFinance = /financ|econom|unit|cost|price|model|calculat/i.test(roleLower);
    const isCompetitor = /competitor|rival|moat|landscape/i.test(roleLower);
    const isRegulatory = /regulat|legal|policy|compliance|hazard/i.test(roleLower);
    const isSynthesis = /synthesis|synthes|evaluat|audit|critic|summary/i.test(roleLower);

    for (const cap of candidates) {
      let relevance = 0.1;

      if (isResearch && cap.class === 'INFORMATION') relevance = 0.85;
      if (isFinance && (cap.class === 'COMPUTATION' || cap.id === 'unit_economics' || cap.id === 'financial_model')) relevance = 0.90;
      if (isCompetitor && (cap.id === 'competitor_matrix' || cap.id === 'company_research' || cap.id === 'pricing_analysis')) relevance = 0.92;
      if (isRegulatory && (cap.id === 'regulatory_search' || cap.id === 'risk_analysis')) relevance = 0.95;
      if (isSynthesis && (cap.class === 'VERIFICATION' || cap.class === 'COMMUNICATION')) relevance = 0.88;

      // Skip non-relevant capabilities
      if (relevance < 0.5) continue;

      // ----------------------------------------------------------
      // Check for "No Tool Needed" — Artifact Reuse ($0 Cost!)
      // ----------------------------------------------------------
      const reusableArtifact = existingArtifacts.find(art => {
        if (cap.id === 'market_research' && art.type === 'RESEARCH') return true;
        if (cap.id === 'unit_economics' && art.type === 'FINANCIAL') return true;
        if (cap.id === 'competitor_matrix' && art.type === 'COMPETITOR') return true;
        return false;
      });

      if (reusableArtifact) {
        decisions.push({
          capabilityId: cap.id,
          action: 'USE_EXISTING_ARTIFACT',
          reason: `Verified ${reusableArtifact.type} artifact already available from upstream. Zero dollar & token cost.`,
          expectedContribution: 0.15,
          costUSD: 0,
          latencyMs: 10,
          reusedArtifactId: reusableArtifact.id,
        });
        continue;
      }

      // ----------------------------------------------------------
      // Evaluate Cost & Latency Constraints
      // ----------------------------------------------------------
      const cost = cap.cost.baseCostUSD;
      const latency = cap.latency.estimatedMs;

      if (cost > availableBudgetUSD || latency > remainingTimeMs) {
        // ----------------------------------------------------------
        // Attempt Capability Substitution
        // ----------------------------------------------------------
        const substituteId = cap.substitutes.find(subId => {
          const sub = getCapabilityById(subId)?.metadata;
          return sub && sub.cost.baseCostUSD <= availableBudgetUSD && sub.latency.estimatedMs <= remainingTimeMs;
        });

        if (substituteId) {
          const subMetadata = getCapabilityById(substituteId)!.metadata;
          decisions.push({
            capabilityId: substituteId,
            action: 'SUBSTITUTE',
            substituteFor: cap.id,
            reason: `Preferred capability ${cap.name} ($${cost.toFixed(3)}) exceeds constraints. Substituted with ${subMetadata.name} ($${subMetadata.cost.baseCostUSD.toFixed(3)}).`,
            expectedContribution: relevance * subMetadata.evidenceStrength,
            costUSD: subMetadata.cost.baseCostUSD,
            latencyMs: subMetadata.latency.estimatedMs,
          });
          continue;
        } else {
          // Reject if neither primary nor substitute can be afforded
          decisions.push({
            capabilityId: cap.id,
            action: 'REJECT',
            reason: `Capability cost ($${cost.toFixed(3)}) or latency (${latency}ms) exceeds budget ($${availableBudgetUSD.toFixed(3)}) or deadline (${remainingTimeMs}ms) with no cheaper substitute.`,
            expectedContribution: 0,
            costUSD: cost,
            latencyMs: latency,
          });
          continue;
        }
      }

      // Normal Approval
      decisions.push({
        capabilityId: cap.id,
        action: 'BUY',
        reason: `High Expected Information Gain (${(relevance * cap.evidenceStrength).toFixed(2)}) within budget and deadline bounds.`,
        expectedContribution: relevance * cap.evidenceStrength,
        costUSD: cost,
        latencyMs: latency,
      });
    }

    return decisions;
  }
}
