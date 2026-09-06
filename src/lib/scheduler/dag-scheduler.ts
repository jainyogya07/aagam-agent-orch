// ============================================================
// DAG Scheduler — Agent Resource Exchange
// ============================================================
// Dependency-aware scheduler that runs agents in parallel
// whenever possible. Independent nodes execute simultaneously.
// This is critical for avoiding sequential bottlenecks.
//
// Algorithm:
// 1. Build adjacency list + in-degree map
// 2. Find nodes with in-degree 0 (no dependencies) → READY
// 3. Launch all READY nodes concurrently (bounded by concurrency)
// 4. On completion → decrement dependents' in-degree
// 5. If dependent's in-degree becomes 0 → mark READY
// 6. Repeat until all nodes complete or failure/timeout
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import type { Architecture, AgentNode } from '@/lib/types/architecture';
import type { AgentExecutionResult } from '@/lib/types/evaluation';
import { eventBus } from '@/lib/events/event-emitter';
import { runAgent, type AgentRunnerInput } from '@/lib/runner/agent-runner';
import { ProviderGateway } from '@/lib/providers/gateway';

export type NodeState = 'PENDING' | 'READY' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'BLOCKED';

interface SchedulerNode {
  agent: AgentNode;
  state: NodeState;
  inDegree: number;
  dependsOn: string[];    // IDs of upstream nodes
  dependedBy: string[];   // IDs of downstream nodes
  result: AgentExecutionResult | null;
}

export interface SchedulerResult {
  results: Map<string, AgentExecutionResult>;
  completedCount: number;
  failedCount: number;
  cancelledCount: number;
  totalCost: number;
  totalLatencyMs: number;
  criticalPathMs: number;
  wallClockMs: number;
}

export interface SchedulerOptions {
  maxConcurrency: number;
  deadlineMs: number;
  taskGoal: string;
  runId: string;
  architectureId: string;
  gateway: ProviderGateway;
  /** Called before launching an agent — return false to block it */
  onBeforeRun?: (agent: AgentNode) => Promise<boolean>;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
}

export async function executeDAG(
  architecture: Architecture,
  options: SchedulerOptions
): Promise<SchedulerResult> {
  const startTime = Date.now();
  const { maxConcurrency, deadlineMs, taskGoal, runId, architectureId, gateway, signal } = options;

  // ----------------------------------------------------------
  // 1. Build the scheduler graph
  // ----------------------------------------------------------
  const nodes = new Map<string, SchedulerNode>();
  const outputs = new Map<string, AgentExecutionResult>();

  for (const agent of architecture.nodes) {
    nodes.set(agent.id, {
      agent,
      state: 'PENDING',
      inDegree: 0,
      dependsOn: [],
      dependedBy: [],
      result: null,
    });
  }

  // Build dependency relationships from edges
  for (const edge of architecture.edges) {
    const source = nodes.get(edge.source);
    const target = nodes.get(edge.target);
    if (source && target) {
      target.inDegree++;
      target.dependsOn.push(edge.source);
      source.dependedBy.push(edge.target);
    }
  }

  // Mark nodes with no dependencies as READY
  for (const [id, node] of nodes) {
    if (node.inDegree === 0) {
      node.state = 'READY';
      eventBus.emit({
        id: uuidv4(),
        runId,
        type: 'agent.ready',
        timestamp: Date.now(),
        payload: { agentId: id, agentName: node.agent.name },
      });
    }
  }

  eventBus.log(runId, 'info', `DAG Scheduler initialized: ${nodes.size} agents, ${architecture.edges.length} edges`);

  // ----------------------------------------------------------
  // 2. Main execution loop
  // ----------------------------------------------------------
  let runningCount = 0;
  let completedCount = 0;
  let failedCount = 0;
  let cancelledCount = 0;

  return new Promise<SchedulerResult>((resolve) => {
    const activePromises = new Map<string, Promise<void>>();

    function checkCompletion() {
      const allDone = [...nodes.values()].every(
        n => n.state === 'COMPLETED' || n.state === 'FAILED' || n.state === 'CANCELLED' || n.state === 'BLOCKED'
      );

      if (allDone || (signal && signal.aborted)) {
        const wallClockMs = Date.now() - startTime;

        // Calculate critical path (longest chain of sequential executions)
        const criticalPathMs = calculateCriticalPath(nodes);

        let totalCost = 0;
        let totalLatencyMs = 0;
        for (const [id, result] of outputs) {
          totalCost += result.cost;
          totalLatencyMs += result.latencyMs;
        }

        resolve({
          results: outputs,
          completedCount,
          failedCount,
          cancelledCount,
          totalCost,
          totalLatencyMs,
          criticalPathMs,
          wallClockMs,
        });
        return true;
      }
      return false;
    }

    function scheduleReady() {
      if (signal?.aborted) {
        // Cancel all remaining nodes
        for (const [id, node] of nodes) {
          if (node.state === 'READY' || node.state === 'PENDING') {
            node.state = 'CANCELLED';
            cancelledCount++;
          }
        }
        checkCompletion();
        return;
      }

      // Check deadline
      const elapsed = Date.now() - startTime;
      if (elapsed >= deadlineMs) {
        eventBus.log(runId, 'warn', `Deadline reached (${deadlineMs}ms). Cancelling remaining agents.`);
        for (const [id, node] of nodes) {
          if (node.state === 'READY' || node.state === 'PENDING') {
            node.state = 'CANCELLED';
            cancelledCount++;
            eventBus.emit({
              id: uuidv4(),
              runId,
              type: 'agent.cancelled',
              timestamp: Date.now(),
              payload: { agentId: id, agentName: node.agent.name, reason: 'deadline' },
            });
          }
        }
        checkCompletion();
        return;
      }

      // Find READY nodes that can be launched
      const readyNodes = [...nodes.entries()]
        .filter(([, n]) => n.state === 'READY')
        .slice(0, maxConcurrency - runningCount);

      for (const [id, node] of readyNodes) {
        // Only skip if deadline has essentially expired (< 1000ms remaining)
        const remainingTime = deadlineMs - (Date.now() - startTime);

        if (remainingTime <= 1000) {
          eventBus.log(runId, 'warn',
            `Skipping ${node.agent.name}: remaining time critically low (${remainingTime}ms)`
          );
          node.state = 'CANCELLED';
          cancelledCount++;
          propagateCancellation(id, nodes);
          continue;
        }

        node.state = 'RUNNING';
        runningCount++;

        // Gather inputs from completed upstream agents
        const inputs: Record<string, string> = {};
        for (const depId of node.dependsOn) {
          const depResult = outputs.get(depId);
          const depNode = nodes.get(depId);
          if (depResult && depNode) {
            inputs[depNode.agent.name] = depResult.output;
          }
        }

        const runnerInput: AgentRunnerInput = {
          agent: node.agent,
          inputs,
          taskGoal,
          runId,
          architectureId,
          gateway,
        };

        const promise = (async () => {
          try {
            // Check onBeforeRun hook (resource exchange can block)
            if (options.onBeforeRun) {
              const allowed = await options.onBeforeRun(node.agent);
              if (!allowed) {
                node.state = 'BLOCKED';
                failedCount++;
                eventBus.log(runId, 'warn', `${node.agent.name} blocked by resource exchange`);
                // Release downstream dependencies so they don't deadlock
                for (const depId of node.dependedBy) {
                  const dep = nodes.get(depId);
                  if (dep) {
                    dep.inDegree--;
                    if (dep.inDegree === 0 && dep.state === 'PENDING') {
                      dep.state = 'READY';
                    }
                  }
                }
                return;
              }
            }

            const result = await runAgent(runnerInput);
            node.result = result;
            outputs.set(id, result);

            if (result.status === 'COMPLETED') {
              node.state = 'COMPLETED';
              completedCount++;

              // Decrement in-degree of dependents
              for (const depId of node.dependedBy) {
                const dep = nodes.get(depId);
                if (dep) {
                  dep.inDegree--;
                  if (dep.inDegree === 0 && dep.state === 'PENDING') {
                    dep.state = 'READY';
                    eventBus.emit({
                      id: uuidv4(),
                      runId,
                      type: 'agent.ready',
                      timestamp: Date.now(),
                      payload: { agentId: depId, agentName: dep.agent.name },
                    });
                  }
                }
              }
            } else {
              node.state = 'FAILED';
              failedCount++;
              // Don't cancel downstream — they may still run with partial inputs
              // But update their dependency state
              for (const depId of node.dependedBy) {
                const dep = nodes.get(depId);
                if (dep) {
                  dep.inDegree--;
                  if (dep.inDegree === 0 && dep.state === 'PENDING') {
                    dep.state = 'READY';
                  }
                }
              }
            }
          } catch (err) {
            node.state = 'FAILED';
            failedCount++;
            for (const depId of node.dependedBy) {
              const dep = nodes.get(depId);
              if (dep) {
                dep.inDegree--;
                if (dep.inDegree === 0 && dep.state === 'PENDING') {
                  dep.state = 'READY';
                }
              }
            }
          } finally {
            runningCount--;
            activePromises.delete(id);

            if (!checkCompletion()) {
              // Schedule more agents now that a slot freed up
              scheduleReady();
            }
          }
        })();

        activePromises.set(id, promise);
      }

      // If nothing is running and nothing is ready, check for deadlock
      if (runningCount === 0 && readyNodes.length === 0) {
        const pendingNodes = [...nodes.values()].filter(n => n.state === 'PENDING');
        if (pendingNodes.length > 0) {
          eventBus.log(runId, 'error', `Deadlock detected: ${pendingNodes.length} nodes stuck in PENDING`);
          for (const node of pendingNodes) {
            node.state = 'CANCELLED';
            cancelledCount++;
          }
        }
        checkCompletion();
      }
    }

    // Kick off the first wave
    scheduleReady();
  });
}

// ----------------------------------------------------------
// Cancel downstream nodes when an upstream is cancelled
// ----------------------------------------------------------

function propagateCancellation(nodeId: string, nodes: Map<string, SchedulerNode>) {
  const node = nodes.get(nodeId);
  if (!node) return;

  for (const depId of node.dependedBy) {
    const dep = nodes.get(depId);
    if (dep && (dep.state === 'PENDING' || dep.state === 'READY')) {
      dep.state = 'CANCELLED';
      propagateCancellation(depId, nodes);
    }
  }
}

// ----------------------------------------------------------
// Calculate critical path duration through the DAG
// ----------------------------------------------------------

function calculateCriticalPath(nodes: Map<string, SchedulerNode>): number {
  const memo = new Map<string, number>();

  function longestPath(nodeId: string): number {
    if (memo.has(nodeId)) return memo.get(nodeId)!;

    const node = nodes.get(nodeId);
    if (!node) return 0;

    const selfTime = node.result?.latencyMs ?? 0;
    let maxDownstream = 0;

    for (const depId of node.dependedBy) {
      maxDownstream = Math.max(maxDownstream, longestPath(depId));
    }

    const total = selfTime + maxDownstream;
    memo.set(nodeId, total);
    return total;
  }

  // Find roots (no incoming edges)
  let maxPath = 0;
  for (const [id, node] of nodes) {
    if (node.dependsOn.length === 0) {
      maxPath = Math.max(maxPath, longestPath(id));
    }
  }

  return maxPath;
}
