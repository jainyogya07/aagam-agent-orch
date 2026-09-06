// ============================================================
// Mutation Engine — Agent Resource Exchange
// ============================================================
// CORE DIFFERENTIATOR: Proposes and validates architecture mutations
// based on execution results and contribution analysis.
// Every mutation has a reason, expected improvement, and risk assessment.
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { ProviderGateway } from '@/lib/providers/gateway';
import {
  ArchitectureSchema,
  validateArchitecture,
  type Architecture,
  type AgentNode,
} from '@/lib/types/architecture';
import type { AgentContribution, EvaluationResult, MutationProposal } from '@/lib/types/evaluation';
import { eventBus } from '@/lib/events/event-emitter';

export interface MutationEngineInput {
  runId: string;
  currentArchitecture: Architecture;
  evaluation: EvaluationResult;
  contributions: AgentContribution[];
  totalCost: number;
  wallClockMs: number;
  budget: number;
  deadlineMs: number;
  reliabilityTarget: number;
  gateway: ProviderGateway;
}

export interface MutationResult {
  proposals: MutationProposal[];
  newArchitecture: Architecture | null;
  accepted: boolean;
  reason: string;
}

import { withTrace } from '@/lib/observability/neatlogs';

export async function proposeMutations(input: MutationEngineInput): Promise<MutationResult> {
  const {
    runId, currentArchitecture, evaluation, contributions,
    totalCost, wallClockMs, budget, deadlineMs, reliabilityTarget, gateway
  } = input;

  return withTrace(
    {
      name: 'mutation-engine',
      kind: 'TASK',
      sessionId: runId,
      attributes: {
        run_id: runId,
        architecture_id: currentArchitecture.id,
        current_version: currentArchitecture.version,
        agent_count: currentArchitecture.nodes.length,
        current_quality: evaluation.qualityScore,
        current_reliability: evaluation.reliabilityScore,
      },
    },
    async () => {
      eventBus.log(runId, 'info', 'Mutation Engine: analyzing for possible improvements...');

      // Check if mutation is worthwhile
      if (meetsAllTargets(evaluation, reliabilityTarget)) {
        eventBus.log(runId, 'info', 'All targets met. No mutation needed.');
        return { proposals: [], newArchitecture: null, accepted: false, reason: 'All targets already met' };
      }

      // Generate mutation proposals using rule-based + contribution signals
      const proposals = await generateProposals(input);

      if (proposals.length === 0) {
        eventBus.log(runId, 'info', 'No viable mutations proposed.');
        return { proposals: [], newArchitecture: null, accepted: false, reason: 'No viable mutations identified' };
      }

  // Emit proposals
  for (const proposal of proposals) {
    eventBus.emit({
      id: uuidv4(),
      runId,
      type: 'mutation.proposed',
      timestamp: Date.now(),
      payload: proposal,
    });
    eventBus.log(runId, 'info',
      `Mutation proposed: ${proposal.type} — ${proposal.reason}`
    );
  }

  // Apply mutations to create candidate architecture
  const candidateArch = applyMutations(currentArchitecture, proposals, runId);

  if (!candidateArch) {
    for (const proposal of proposals) {
      eventBus.emit({
        id: uuidv4(),
        runId,
        type: 'mutation.rejected',
        timestamp: Date.now(),
        payload: { ...proposal, rejectionReason: 'Failed to produce valid architecture' },
      });
    }
    return {
      proposals,
      newArchitecture: null,
      accepted: false,
      reason: 'Mutations produced invalid architecture',
    };
  }

  // Validate the candidate
  const validation = validateMutationSafety(candidateArch, budget, deadlineMs, reliabilityTarget);
  if (!validation.safe) {
    eventBus.log(runId, 'warn', `Mutation rejected: ${validation.reason}`);
    for (const proposal of proposals) {
      eventBus.emit({
        id: uuidv4(),
        runId,
        type: 'mutation.rejected',
        timestamp: Date.now(),
        payload: { ...proposal, rejectionReason: validation.reason },
      });
    }
    return {
      proposals,
      newArchitecture: null,
      accepted: false,
      reason: validation.reason,
    };
  }

  // Accept mutations
  for (const proposal of proposals) {
    eventBus.emit({
      id: uuidv4(),
      runId,
      type: 'mutation.accepted',
      timestamp: Date.now(),
      payload: proposal,
    });
  }

  eventBus.emit({
    id: uuidv4(),
    runId,
    type: 'architecture.updated',
    timestamp: Date.now(),
    payload: {
      previousVersion: currentArchitecture.version,
      newVersion: candidateArch.version,
      nodeCount: candidateArch.nodes.length,
      edgeCount: candidateArch.edges.length,
      mutations: proposals.map(p => p.type),
      agents: candidateArch.nodes.map(n => ({
        id: n.id,
        name: n.name,
        role: n.role,
        objective: n.objective,
        model: n.model,
        tools: n.tools,
        resourceBudget: n.resourceBudget,
      })),
      edges: candidateArch.edges.map(e => ({
        source: e.source,
        target: e.target,
        dataContract: e.dataContract,
      })),
    },
  });

  return {
    proposals,
    newArchitecture: candidateArch,
    accepted: true,
    reason: `Applied ${proposals.length} mutation(s): ${proposals.map(p => p.type).join(', ')}`,
  };
    }
  );
}

// ----------------------------------------------------------
// Mutation Proposal Generation
// ----------------------------------------------------------

async function generateProposals(input: MutationEngineInput): Promise<MutationProposal[]> {
  const { runId, currentArchitecture, evaluation, contributions, gateway } = input;

  const proposals: MutationProposal[] = [];

  // Sort contributions ascending by marginal quality gain (lowest first)
  const sortedAsc = [...contributions].sort((a, b) => a.marginalQualityGain - b.marginalQualityGain);

  // 1. REMOVE low-contribution or highly redundant agents (Pruning)
  for (const contrib of sortedAsc) {
    if ((contrib.marginalQualityGain < 0.06 || contrib.redundancyRatio > 0.5) &&
        currentArchitecture.nodes.length > 2) {
      proposals.push({
        id: uuidv4(),
        type: 'REMOVE_AGENT',
        targetNodeId: contrib.agentId,
        reason: `Low marginal contribution (${(contrib.marginalQualityGain * 100).toFixed(1)}%) and high redundancy (${(contrib.redundancyRatio * 100).toFixed(0)}%)`,
        expectedImprovement: `Prune redundant work, freeing scarce budget for high-value verification and reducing graph latency`,
        estimatedCost: 0,
        risk: `Minimal risk — coverage maintained by parallel capability nodes`,
      });
      break; // Prune 1 redundant node per iteration to maintain stability
    }
  }

  // 2. CHANGE_RESOURCE_ALLOCATION for high-value or verification agents
  const highValue = contributions.filter(c => (c.marginalQualityGain > 0.07 || c.costEfficiency > 0.5) && c.redundancyRatio < 0.4);
  for (const hv of highValue) {
    const node = currentArchitecture.nodes.find(n => n.id === hv.agentId);
    if (node) {
      const updatedCost = Number(((node.resourceBudget.maxCost || 0.05) * 1.5).toFixed(4));
      const updatedTokens = Math.min(4000, (node.resourceBudget.maxTokens || 1500) + 1000);
      proposals.push({
        id: uuidv4(),
        type: 'CHANGE_RESOURCE_ALLOCATION',
        targetNodeId: hv.agentId,
        reason: `${hv.agentName} demonstrates high marginal contribution (${(hv.marginalQualityGain * 100).toFixed(1)}%). Upgrading resource budget.`,
        expectedImprovement: 'Higher depth of verification and synthesis (+0.10 expected quality gain)',
        estimatedCost: updatedCost - node.resourceBudget.maxCost,
        risk: 'Consumes portion of reserve pool',
        payload: {
          newMaxCost: updatedCost,
          newMaxTokens: updatedTokens,
        },
      });
      break; // Upgrade 1 key agent per iteration
    }
  }

  // 3. CHANGE_MODEL for expensive agents with low complexity output
  for (const contrib of contributions) {
    const node = currentArchitecture.nodes.find(n => n.id === contrib.agentId);
    if (!node) continue;

    if (node.model === 'gpt-4o' && contrib.marginalQualityGain < 0.15) {
      proposals.push({
        id: uuidv4(),
        type: 'CHANGE_MODEL',
        targetNodeId: contrib.agentId,
        reason: `${contrib.agentName} uses expensive model (gpt-4o) but contribution is moderate (${(contrib.marginalQualityGain * 100).toFixed(1)}%)`,
        expectedImprovement: 'Reduce cost by ~60% by switching to gpt-4o-mini',
        estimatedCost: 0,
        risk: 'Potential quality reduction for complex reasoning tasks',
        payload: { newModel: 'gpt-4o-mini' },
      });
    }
  }

  return proposals.slice(0, 3);
}

// ----------------------------------------------------------
// Apply Mutations to Create New Architecture
// ----------------------------------------------------------

function applyMutations(
  current: Architecture,
  proposals: MutationProposal[],
  runId: string
): Architecture | null {
  try {
    // Deep clone
    const newArch: Architecture = JSON.parse(JSON.stringify(current));
    newArch.id = uuidv4();
    newArch.version = current.version + 1;
    newArch.parentArchitectureId = current.id;
    newArch.score = null;
    newArch.createdAt = new Date().toISOString();

    const mutationReasons: string[] = [];

    for (const proposal of proposals) {
      switch (proposal.type) {
        case 'REMOVE_AGENT': {
          if (!proposal.targetNodeId) break;
          newArch.nodes = newArch.nodes.filter(n => n.id !== proposal.targetNodeId);
          newArch.edges = newArch.edges.filter(
            e => e.source !== proposal.targetNodeId && e.target !== proposal.targetNodeId
          );
          // Rewire: connect removed node's upstream to its downstream
          const removedEdgesIn = current.edges.filter(e => e.target === proposal.targetNodeId);
          const removedEdgesOut = current.edges.filter(e => e.source === proposal.targetNodeId);
          for (const inEdge of removedEdgesIn) {
            for (const outEdge of removedEdgesOut) {
              // Only add if this edge doesn't already exist
              const exists = newArch.edges.some(
                e => e.source === inEdge.source && e.target === outEdge.target
              );
              if (!exists && inEdge.source !== outEdge.target) {
                newArch.edges.push({
                  source: inEdge.source,
                  target: outEdge.target,
                  dataContract: 'rewired after agent removal',
                });
              }
            }
          }
          mutationReasons.push(`Removed ${proposal.targetNodeId}: ${proposal.reason}`);
          break;
        }

        case 'CHANGE_MODEL': {
          if (!proposal.targetNodeId || !proposal.payload?.newModel) break;
          const node = newArch.nodes.find(n => n.id === proposal.targetNodeId);
          if (node) {
            node.model = String(proposal.payload.newModel);
          }
          mutationReasons.push(`Changed model for ${proposal.targetNodeId}: ${proposal.reason}`);
          break;
        }

        case 'CHANGE_RESOURCE_ALLOCATION': {
          if (!proposal.targetNodeId) break;
          const node = newArch.nodes.find(n => n.id === proposal.targetNodeId);
          if (node) {
            if (proposal.payload?.newMaxCost) {
              node.resourceBudget.maxCost = Number(proposal.payload.newMaxCost);
            }
            if (proposal.payload?.newMaxTokens) {
              node.resourceBudget.maxTokens = Number(proposal.payload.newMaxTokens);
            }
          }
          mutationReasons.push(`Reallocated for ${proposal.targetNodeId}: ${proposal.reason}`);
          break;
        }

        // ADD_AGENT, REWIRE, etc. can be expanded later
        default:
          break;
      }
    }

    newArch.mutationReason = mutationReasons.join('; ');

    // Validate the result
    const validation = validateArchitecture(newArch);
    if (!validation.valid) {
      eventBus.log(runId, 'error', `Mutated architecture invalid: ${validation.errors.join(', ')}`);
      return null;
    }

    return newArch;

  } catch (error) {
    eventBus.log(runId, 'error',
      `Failed to apply mutations: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return null;
  }
}

// ----------------------------------------------------------
// Mutation Safety Validation
// ----------------------------------------------------------

interface SafetyResult {
  safe: boolean;
  reason: string;
}

function validateMutationSafety(
  arch: Architecture,
  budget: number,
  deadlineMs: number,
  reliabilityTarget: number
): SafetyResult {
  // 1. Must remain a valid DAG
  const dagResult = validateArchitecture(arch);
  if (!dagResult.valid) {
    return { safe: false, reason: `Invalid DAG: ${dagResult.errors.join(', ')}` };
  }

  // 2. Must have at least one node
  if (arch.nodes.length === 0) {
    return { safe: false, reason: 'Architecture has no agents' };
  }

  // 3. Total budget allocation must be feasible
  const totalAllocated = arch.nodes.reduce((sum, n) => sum + n.resourceBudget.maxCost, 0);
  if (totalAllocated > budget * 1.2) { // Allow 20% overflow for estimation error
    return { safe: false, reason: `Total allocation ($${totalAllocated.toFixed(4)}) exceeds budget ($${budget.toFixed(2)})` };
  }

  // 4. Must have connected outputs (no orphaned nodes without downstream)
  // At least one "sink" node should exist
  const sinks = arch.nodes.filter(n =>
    !arch.edges.some(e => e.source === n.id)
  );
  if (sinks.length === 0 && arch.nodes.length > 1) {
    return { safe: false, reason: 'No terminal/sink nodes — architecture has no output endpoint' };
  }

  return { safe: true, reason: 'All safety checks passed' };
}

// ----------------------------------------------------------
// Target Checking
// ----------------------------------------------------------

function meetsAllTargets(evaluation: EvaluationResult, reliabilityTarget: number): boolean {
  return (
    evaluation.constraintCompliance.budgetMet &&
    evaluation.constraintCompliance.deadlineMet &&
    evaluation.reliabilityScore >= reliabilityTarget &&
    evaluation.qualityScore >= 0.8
  );
}
