'use client';

import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  Position,
  Handle,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useRunStore } from '@/stores/run-store';

// ----------------------------------------------------------
// Custom Agent Card Node
// ----------------------------------------------------------

function AgentCardNode({ data }: { data: Record<string, unknown> }) {
  const status = String(data.status || 'PENDING').toLowerCase();

  return (
    <div className={`agent-card ${status}`}>
      <Handle type="target" position={Position.Top} style={{ background: 'var(--color-accent)', width: 8, height: 8, border: '2px solid var(--color-surface-2)' }} />

      <div className="agent-card-header">
        <span className="agent-card-name">{String(data.name || 'Agent')}</span>
        <span className={`status-dot ${status}`} />
      </div>

      <div className="agent-card-role">{String(data.role || '')}</div>

      <div className="agent-card-stat">
        <span className="agent-card-stat-label">Model</span>
        <span className="agent-card-stat-value">{String(data.model || '—')}</span>
      </div>

      <div className="agent-card-stat">
        <span className="agent-card-stat-label">Cost</span>
        <span className="agent-card-stat-value">
          ${(Number(data.cost) || 0).toFixed(4)}
        </span>
      </div>

      <div className="agent-card-stat">
        <span className="agent-card-stat-label">Tokens</span>
        <span className="agent-card-stat-value">
          {formatTokens(Number(data.tokensIn || 0) + Number(data.tokensOut || 0))}
        </span>
      </div>

      <div className="agent-card-stat">
        <span className="agent-card-stat-label">Tools</span>
        <span className="agent-card-stat-value">{Number(data.toolCallCount) || 0}</span>
      </div>

      {data.contribution !== undefined && Number(data.contribution) > 0 && (
        <div className="agent-card-stat">
          <span className="agent-card-stat-label">Contribution</span>
          <span className="agent-card-stat-value" style={{
            color: Number(data.contribution) > 0.1 ? 'var(--color-success)' : 'var(--color-warning)',
          }}>
            +{(Number(data.contribution) * 100).toFixed(1)}%
          </span>
        </div>
      )}

      {data.latencyMs !== undefined && Number(data.latencyMs) > 0 && (
        <div className="agent-card-stat">
          <span className="agent-card-stat-label">Latency</span>
          <span className="agent-card-stat-value">
            {(Number(data.latencyMs) / 1000).toFixed(1)}s
          </span>
        </div>
      )}

      {Boolean(data.aoSessionId) && (
        <div className="agent-card-stat" style={{ borderTop: '1px dashed var(--color-border)', paddingTop: 4 }}>
          <span className="agent-card-stat-label">Session</span>
          <span className="agent-card-stat-value" style={{ color: 'var(--color-accent)' }}>
            AO-{String(data.aoSessionId).replace(/^[a-z]+-/, '')}
          </span>
        </div>
      )}

      {Boolean(data.harness) && (
        <div className="agent-card-stat">
          <span className="agent-card-stat-label">Execution</span>
          <span className="agent-card-stat-value" style={{ textTransform: 'capitalize' }}>
            {String(data.harness)}
          </span>
        </div>
      )}

      <div className={`agent-card-status ${status}`}>
        {status}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--color-accent)', width: 8, height: 8, border: '2px solid var(--color-surface-2)' }} />
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

const nodeTypes = { agentCard: AgentCardNode };

// ----------------------------------------------------------
// Architecture Canvas
// ----------------------------------------------------------

export default function ArchitectureCanvas() {
  const storeNodes = useRunStore(s => s.nodes);
  const storeEdges = useRunStore(s => s.edges);
  const status = useRunStore(s => s.status);
  const currentVersion = useRunStore(s => s.currentVersion);

  // Auto-layout nodes in a simple dagre-like arrangement
  const flowNodes: Node[] = useMemo(() => {
    if (storeNodes.length === 0) return [];

    // Simple vertical layout with horizontal spread for parallel nodes
    // Group by "level" based on edge structure
    const levels = computeLevels(storeNodes, storeEdges);
    const nodesByLevel = new Map<number, typeof storeNodes>();

    storeNodes.forEach((node, i) => {
      const level = levels.get(node.id) ?? i;
      if (!nodesByLevel.has(level)) nodesByLevel.set(level, []);
      nodesByLevel.get(level)!.push(node);
    });

    const result: Node[] = [];
    const ySpacing = 180;
    const xSpacing = 280;

    for (const [level, nodesAtLevel] of nodesByLevel) {
      const totalWidth = (nodesAtLevel.length - 1) * xSpacing;
      const startX = -totalWidth / 2;

      nodesAtLevel.forEach((node, i) => {
        result.push({
          id: node.id,
          type: 'agentCard',
          position: { x: startX + i * xSpacing, y: level * ySpacing },
          data: {
            name: node.name,
            role: node.role,
            model: node.model,
            status: node.status,
            cost: node.cost,
            tokensIn: node.tokensIn,
            tokensOut: node.tokensOut,
            toolCallCount: node.toolCallCount,
            contribution: node.contribution,
            latencyMs: node.latencyMs,
          },
        });
      });
    }

    return result;
  }, [storeNodes, storeEdges]);

  const flowEdges: Edge[] = useMemo(() => {
    return storeEdges.map((edge, i) => ({
      id: `edge-${i}`,
      source: edge.source,
      target: edge.target,
      animated: edge.animated ?? false,
      style: {
        stroke: edge.animated ? '#6366f1' : '#2d2d3a',
        strokeWidth: edge.animated ? 2 : 1,
      },
    }));
  }, [storeEdges]);

  if (status === 'idle') {
    return (
      <div className="app-canvas">
        <div className="empty-state">
          <div className="empty-state-icon">⬡</div>
          <div className="empty-state-text">Create a task to visualize the agent architecture</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-canvas">
      {/* Architecture version badge */}
      {currentVersion > 0 && (
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          background: 'var(--color-surface-3)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          padding: '6px 12px',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--color-accent-light)',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span>⬡</span> Architecture V{currentVersion}
        </div>
      )}

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={false}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1a1a24" />
        <Controls
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', borderRadius: 8 }}
        />
      </ReactFlow>
    </div>
  );
}

// ----------------------------------------------------------
// Compute topological levels for layout
// ----------------------------------------------------------

function computeLevels(
  nodes: Array<{ id: string }>,
  edges: Array<{ source: string; target: string }>
): Map<string, number> {
  const levels = new Map<string, number>();
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  }

  for (const e of edges) {
    adj.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  }

  // BFS for level assignment
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) {
      queue.push(id);
      levels.set(id, 0);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = levels.get(current) || 0;

    for (const next of adj.get(current) || []) {
      const newDeg = (inDegree.get(next) || 1) - 1;
      inDegree.set(next, newDeg);

      const existingLevel = levels.get(next);
      levels.set(next, Math.max(existingLevel ?? 0, currentLevel + 1));

      if (newDeg === 0) {
        queue.push(next);
      }
    }
  }

  // Assign levels to any unprocessed nodes
  let maxLevel = 0;
  for (const l of levels.values()) maxLevel = Math.max(maxLevel, l);
  for (const n of nodes) {
    if (!levels.has(n.id)) levels.set(n.id, maxLevel + 1);
  }

  return levels;
}
