// ============================================================
// Event Types — Agent Resource Exchange
// ============================================================
// All system components emit typed events.
// Events are streamed to the frontend via SSE and persisted to DB.
// ============================================================

export type SystemEventType =
  | 'run.started'
  | 'run.completed'
  | 'run.failed'
  | 'run.timeout'
  | 'architecture.created'
  | 'architecture.updated'
  | 'architecture.compared'
  | 'agent.created'
  | 'agent.ready'
  | 'agent.started'
  | 'agent.completed'
  | 'agent.failed'
  | 'agent.cancelled'
  | 'resource.requested'
  | 'resource.approved'
  | 'resource.partial'
  | 'resource.rejected'
  | 'resource.reallocated'
  | 'resource.reclaimed'
  | 'evaluation.started'
  | 'evaluation.completed'
  | 'claim.verified'
  | 'critic.completed'
  | 'quality.gate.evaluated'
  | 'repair.started'
  | 'repair.completed'
  | 'contribution.analyzed'
  | 'mutation.proposed'
  | 'mutation.accepted'
  | 'mutation.rejected'
  | 'ao.session.created'
  | 'ao.worker.started'
  | 'ao.worker.active'
  | 'ao.worker.waiting'
  | 'ao.worker.completed'
  | 'ao.worker.failed'
  | 'ao.worktree.changed'
  | 'scheduler.tick'
  | 'log.info'
  | 'log.warn'
  | 'log.error';

export interface SystemEvent {
  id: string;
  runId: string;
  type: SystemEventType;
  timestamp: number;
  payload: Record<string, unknown>;
}

// ----------------------------------------------------------
// Event Listener
// ----------------------------------------------------------

export type EventListener = (event: SystemEvent) => void;

// ----------------------------------------------------------
// Event Bus Interface
// ----------------------------------------------------------

export interface EventBus {
  emit(event: SystemEvent): void;
  on(type: SystemEventType | '*', listener: EventListener): () => void;
  off(type: SystemEventType | '*', listener: EventListener): void;
  getHistory(runId: string): SystemEvent[];
  clear(runId: string): void;
}
