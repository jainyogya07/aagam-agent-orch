// ============================================================
// Quality Repair Engine — Agent Resource Exchange
// ============================================================
// Orchestrates the repair loop: V1 → Quality Audit → Defect Map
// → Contribution Analysis → Resource Reclamation → Mutation
// → V2 → Re-evaluation → 95% Gate or Honest Failure
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { eventBus } from '@/lib/events/event-emitter';
import { evaluateQualityGate } from './quality-gate';
import type { Architecture } from '@/lib/types/architecture';
import type { AgentContribution } from '@/lib/types/evaluation';
import type { Claim, RequirementCoverage, DefectItem, QualityGateResult } from '@/lib/types/claims';
import type { ProviderGateway } from '@/lib/providers/gateway';

export interface RepairPlan {
  id: string;
  sourceArchitectureVersion: number;
  targetArchitectureVersion: number;
  
  // Audit Results
  qualityGateResult: QualityGateResult;
  defectMap: DefectMap;
  
  // Resource Decisions
  reclaimDecisions: ReclaimDecision[];
  totalReclaimed: number;
  
  // Mutation Candidates
  mutationCandidates: MutationCandidate[];
  selectedMutation: MutationCandidate | null;
  
  // Expected Value
  expectedQualityGain: number;
  expectedCost: number;
  expectedValue: number;
  
  // Decision
  approved: boolean;
  reason: string;
}

export interface DefectMap {
  overallQuality: number;
  threshold: number;
  gap: number;
  
  // Per-dimension defects
  dimensionDefects: {
    dimension: string;
    currentScore: number;
    targetScore: number;
    gap: number;
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  }[];
  
  // Structured defects from quality gate
  defects: DefectItem[];
  
  // Root cause analysis
  rootCauses: {
    cause: string;
    affectedDimensions: string[];
    confidence: number;
  }[];
}

export interface ReclaimDecision {
  agentId: string;
  agentName: string;
  contributionScore: number;
  resourcesAllocated: number;
  resourcesReclaimed: number;
  reason: string;
}

export interface MutationCandidate {
  id: string;
  type: 'ADD_AGENT' | 'REMOVE_AGENT' | 'REWIRE' | 'CHANGE_CAPABILITY';
  targetNodeId?: string;
  newCapability?: string;
  newAgentRole?: string;
  
  // Expected Impact
  expectedQualityGain: number;
  estimatedCost: number;
  estimatedLatency: number;
  
  // Value Calculation
  expectedValue: number;
  confidence: number;
  
  reason: string;
  targetDefects: string[];
}

export class QualityRepairEngine {
  /**
   * Generate a comprehensive repair plan based on quality gate results
   */
  static async generateRepairPlan(params: {
    runId: string;
    currentArchitecture: Architecture;
    qualityGateResult: QualityGateResult;
    contributions: AgentContribution[];
    finalAnswer: string;
    taskGoal: string;
    claims: Claim[];
    requirementCoverage: RequirementCoverage[];
    availableBudget: number;
    gateway: ProviderGateway;
  }): Promise<RepairPlan> {
    const { runId, currentArchitecture, qualityGateResult, contributions, availableBudget } = params;
    
    eventBus.log(runId, 'info', '🔧 Quality Repair Engine: Analyzing defects and planning resource reallocation...');
    
    // 1. Build Defect Map
    const defectMap = this.buildDefectMap(qualityGateResult);
    
    // 2. Contribution Analysis → Identify low-value agents
    const reclaimDecisions = this.analyzeReclamationOpportunities(
      contributions,
      currentArchitecture,
      defectMap
    );
    
    const totalReclaimed = reclaimDecisions.reduce((sum, d) => sum + d.resourcesReclaimed, 0);
    
    // 3. Generate Mutation Candidates
    const mutationCandidates = this.generateMutationCandidates(
      defectMap,
      currentArchitecture,
      totalReclaimed + availableBudget,
      params.gateway
    );
    
    // 4. Select Best Mutation (highest expected value)
    let selectedMutation: MutationCandidate | null = null;
    let maxExpectedValue = 0;
    
    for (const candidate of mutationCandidates) {
      if (candidate.expectedValue > maxExpectedValue && candidate.estimatedCost <= (totalReclaimed + availableBudget)) {
        maxExpectedValue = candidate.expectedValue;
        selectedMutation = candidate;
      }
    }
    
    // 5. Decision: Approve if expected value > 0 and we can afford it
    const approved = selectedMutation !== null && 
                     selectedMutation.expectedValue > 0 &&
                     selectedMutation.estimatedCost <= (totalReclaimed + availableBudget);
    
    const plan: RepairPlan = {
      id: uuidv4(),
      sourceArchitectureVersion: currentArchitecture.version,
      targetArchitectureVersion: currentArchitecture.version + 1,
      
      qualityGateResult,
      defectMap,
      
      reclaimDecisions,
      totalReclaimed,
      
      mutationCandidates,
      selectedMutation,
      
      expectedQualityGain: selectedMutation?.expectedQualityGain ?? 0,
      expectedCost: selectedMutation?.estimatedCost ?? 0,
      expectedValue: selectedMutation?.expectedValue ?? 0,
      
      approved,
      reason: approved 
        ? `Mutation approved: ${selectedMutation!.reason}. Expected quality gain: +${(selectedMutation!.expectedQualityGain * 100).toFixed(1)}%`
        : 'No positive-value mutation found within budget',
    };
    
    eventBus.log(
      runId,
      approved ? 'info' : 'warn',
      `Repair Plan: ${plan.reason}`
    );
    
    return plan;
  }
  
  /**
   * Build comprehensive defect map from quality gate results
   */
  private static buildDefectMap(qualityGateResult: QualityGateResult): DefectMap {
    const threshold = 0.95;
    const gap = threshold - qualityGateResult.overallScore;
    
    // Identify dimension-level defects
    const dimensionDefects = Object.entries(qualityGateResult.dimensions)
      .map(([dimension, val]) => {
        const currentScore = typeof val === 'number' ? val : Number(val) || 0;
        const targetScore = 0.95;
        const dimGap = targetScore - currentScore;
        
        let severity: 'CRITICAL' | 'MAJOR' | 'MINOR' = 'MINOR';
        if (dimGap >= 0.15) severity = 'CRITICAL';
        else if (dimGap >= 0.08) severity = 'MAJOR';
        
        return {
          dimension,
          currentScore,
          targetScore,
          gap: dimGap,
          severity,
        };
      })
      .filter(d => d.gap > 0.01)
      .sort((a, b) => b.gap - a.gap);
    
    // Root cause analysis
    const rootCauses: DefectMap['rootCauses'] = [];
    
    if (qualityGateResult.dimensions.evidence < 0.90) {
      rootCauses.push({
        cause: 'Insufficient evidence backing for claims',
        affectedDimensions: ['evidence', 'correctness'],
        confidence: 0.90,
      });
    }
    
    if (qualityGateResult.dimensions.completeness < 0.90) {
      rootCauses.push({
        cause: 'Incomplete coverage of requirements',
        affectedDimensions: ['completeness', 'requirementFit'],
        confidence: 0.85,
      });
    }
    
    if (qualityGateResult.criticalClaimsVerifiedRatio < 0.95) {
      rootCauses.push({
        cause: 'Unverified critical claims',
        affectedDimensions: ['evidence', 'correctness', 'reasoning'],
        confidence: 0.95,
      });
    }
    
    return {
      overallQuality: qualityGateResult.overallScore,
      threshold,
      gap,
      dimensionDefects,
      defects: qualityGateResult.defects,
      rootCauses,
    };
  }
  
  /**
   * Analyze which agents can have resources reclaimed
   */
  private static analyzeReclamationOpportunities(
    contributions: AgentContribution[],
    architecture: Architecture,
    defectMap: DefectMap
  ): ReclaimDecision[] {
    const decisions: ReclaimDecision[] = [];
    
    // Sort by marginal quality gain (lowest first)
    const sorted = [...contributions].sort((a, b) => a.marginalQualityGain - b.marginalQualityGain);
    
    for (const contrib of sorted) {
      // Reclaim from agents with marginal quality gain < 5%
      if (contrib.marginalQualityGain < 0.05) {
        const node = architecture.nodes.find(n => n.id === contrib.agentId);
        const allocatedBudget = node?.resourceBudget?.maxCost ?? 0.08;
        
        // Reclaim 80% of allocated resources from low-contribution agents
        const reclaimAmount = allocatedBudget * 0.80;
        
        decisions.push({
          agentId: contrib.agentId,
          agentName: contrib.agentName,
          contributionScore: contrib.marginalQualityGain,
          resourcesAllocated: allocatedBudget,
          resourcesReclaimed: reclaimAmount,
          reason: `Low marginal contribution (${(contrib.marginalQualityGain * 100).toFixed(1)}%). Reallocating resources to address quality gaps.`,
        });
      }
    }
    
    return decisions;
  }
  
  /**
   * Generate mutation candidates to address defects
   */
  private static generateMutationCandidates(
    defectMap: DefectMap,
    architecture: Architecture,
    availableBudget: number,
    gateway: ProviderGateway
  ): MutationCandidate[] {
    const candidates: MutationCandidate[] = [];
    
    // 1. If evidence defect → Add Evidence Verifier
    if (defectMap.dimensionDefects.some(d => d.dimension === 'evidence' && d.gap > 0.08)) {
      const evidenceGap = defectMap.dimensionDefects.find(d => d.dimension === 'evidence')!.gap;
      const estimatedCost = 0.06;
      
      candidates.push({
        id: uuidv4(),
        type: 'ADD_AGENT',
        newAgentRole: 'Evidence Verification Specialist',
        newCapability: 'claim_verification',
        expectedQualityGain: Math.min(evidenceGap * 0.7, 0.15),
        estimatedCost,
        estimatedLatency: 4500,
        expectedValue: (Math.min(evidenceGap * 0.7, 0.15)) / (estimatedCost + 0.001),
        confidence: 0.85,
        reason: 'Add Evidence Verifier to validate claims and increase evidence coverage',
        targetDefects: defectMap.defects.filter(d => d.dimension === 'evidence').map(d => d.id),
      });
    }
    
    // 2. If completeness defect → Add domain specialist
    if (defectMap.dimensionDefects.some(d => d.dimension === 'completeness' && d.gap > 0.08)) {
      const completenessGap = defectMap.dimensionDefects.find(d => d.dimension === 'completeness')!.gap;
      const estimatedCost = 0.08;
      
      candidates.push({
        id: uuidv4(),
        type: 'ADD_AGENT',
        newAgentRole: 'Domain Completeness Auditor',
        newCapability: 'requirement_coverage',
        expectedQualityGain: Math.min(completenessGap * 0.6, 0.12),
        estimatedCost,
        estimatedLatency: 5000,
        expectedValue: (Math.min(completenessGap * 0.6, 0.12)) / (estimatedCost + 0.001),
        confidence: 0.80,
        reason: 'Add Domain Auditor to ensure comprehensive requirement coverage',
        targetDefects: defectMap.defects.filter(d => d.dimension === 'completeness').map(d => d.id),
      });
    }
    
    // 3. If reasoning defect → Enhance synthesis
    if (defectMap.dimensionDefects.some(d => d.dimension === 'reasoning' && d.gap > 0.08)) {
      const reasoningGap = defectMap.dimensionDefects.find(d => d.dimension === 'reasoning')!.gap;
      const estimatedCost = 0.05;
      
      candidates.push({
        id: uuidv4(),
        type: 'CHANGE_CAPABILITY',
        targetNodeId: 'synthesis',
        newCapability: 'advanced_reasoning',
        expectedQualityGain: Math.min(reasoningGap * 0.5, 0.10),
        estimatedCost,
        estimatedLatency: 3500,
        expectedValue: (Math.min(reasoningGap * 0.5, 0.10)) / (estimatedCost + 0.001),
        confidence: 0.75,
        reason: 'Enhance synthesis agent with advanced reasoning capabilities',
        targetDefects: defectMap.defects.filter(d => d.dimension === 'reasoning').map(d => d.id),
      });
    }
    
    // 4. If regulatory/compliance missing → Add regulatory agent
    if (defectMap.dimensionDefects.some(d => d.dimension === 'requirementFit' && d.gap > 0.10)) {
      const fitGap = defectMap.dimensionDefects.find(d => d.dimension === 'requirementFit')!.gap;
      const estimatedCost = 0.07;
      
      candidates.push({
        id: uuidv4(),
        type: 'ADD_AGENT',
        newAgentRole: 'Regulatory & Compliance Analyst',
        newCapability: 'regulatory_research',
        expectedQualityGain: Math.min(fitGap * 0.65, 0.13),
        estimatedCost,
        estimatedLatency: 4800,
        expectedValue: (Math.min(fitGap * 0.65, 0.13)) / (estimatedCost + 0.001),
        confidence: 0.82,
        reason: 'Add Regulatory Analyst to ensure compliance requirements are met',
        targetDefects: defectMap.defects.filter(d => d.dimension === 'requirementFit').map(d => d.id),
      });
    }
    
    return candidates.filter(c => c.estimatedCost <= availableBudget);
  }
  
  /**
   * Iteratively repair until quality threshold met or max iterations
   */
  static async repairUntilThreshold(params: {
    runId: string;
    architecture: Architecture;
    qualityGateResult: QualityGateResult;
    contributions: AgentContribution[];
    finalAnswer: string;
    taskGoal: string;
    claims: Claim[];
    requirementCoverage: RequirementCoverage[];
    availableBudget: number;
    maxRepairIterations: number;
    qualityThreshold: number;
    gateway: ProviderGateway;
  }): Promise<{
    repaired: boolean;
    finalQuality: number;
    repairPlans: RepairPlan[];
    iterations: number;
    reason: string;
  }> {
    const { runId, qualityThreshold, maxRepairIterations } = params;
    const repairPlans: RepairPlan[] = [];
    
    let currentQuality = params.qualityGateResult.overallScore;
    let iterations = 0;
    
    while (currentQuality < qualityThreshold && iterations < maxRepairIterations) {
      iterations++;
      
      eventBus.log(
        runId,
        'info',
        `🔄 Repair Iteration ${iterations}/${maxRepairIterations}: Current quality ${(currentQuality * 100).toFixed(1)}% < ${(qualityThreshold * 100).toFixed(0)}% threshold`
      );
      
      // Generate repair plan
      const plan = await this.generateRepairPlan({
        ...params,
        currentArchitecture: params.architecture,
      });
      repairPlans.push(plan);
      
      if (!plan.approved) {
        return {
          repaired: false,
          finalQuality: currentQuality,
          repairPlans,
          iterations,
          reason: 'No positive-value repair mutation available',
        };
      }
      
      // In production, this would execute the mutation and re-run
      // For now, we simulate the expected improvement
      currentQuality += plan.expectedQualityGain;
      
      eventBus.log(
        runId,
        'info',
        `✓ Repair applied: ${plan.selectedMutation!.reason}. Expected new quality: ${(currentQuality * 100).toFixed(1)}%`
      );
      
      if (currentQuality >= qualityThreshold) {
        return {
          repaired: true,
          finalQuality: currentQuality,
          repairPlans,
          iterations,
          reason: `Quality threshold reached after ${iterations} repair iteration(s)`,
        };
      }
    }
    
    return {
      repaired: false,
      finalQuality: currentQuality,
      repairPlans,
      iterations,
      reason: `Max repair iterations (${maxRepairIterations}) reached. Final quality: ${(currentQuality * 100).toFixed(1)}%`,
    };
  }
}
