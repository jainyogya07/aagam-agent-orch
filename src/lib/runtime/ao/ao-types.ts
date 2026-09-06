// ============================================================
// AO Desktop Runtime Types — Agent Resource Exchange
// ============================================================
// Types representing sessions, options, statuses, and correlation
// between AAGAM's intelligence plane and AO's desktop runtime.
// ============================================================

export type AOActivityState = 'idle' | 'active' | 'exited' | 'working' | 'waiting' | 'failed';

export type AOSessionRole = 'worker' | 'orchestrator';

export interface AOSessionActivity {
  state: AOActivityState | string;
  lastActivityAt?: string;
  details?: Record<string, unknown>;
}

export interface AOSession {
  id: string;
  projectId: string;
  kind?: string;
  role?: AOSessionRole;
  harness: string;
  displayName?: string;
  activity?: AOSessionActivity;
  isTerminated: boolean;
  createdAt: string;
  updatedAt: string;
  status: string;
}

export interface AOSpawnOptions {
  project?: string;
  name: string;
  harness?: string;
  prompt?: string;
  kind?: 'worker' | 'orchestrator';
  mode?: 'chat' | 'tui';
  model?: string;
  branch?: string;
}

export interface AOMessagePayload {
  session: string;
  message: string;
}

export interface AOHarnessInfo {
  id: string;
  label: string;
  authStatus?: string;
}

export interface AODaemonHealth {
  executablePath?: string;
  pid?: number;
  service?: string;
  status: 'ok' | 'ready' | 'stopped' | 'error';
  startupWorkingDirectory?: string;
  workingDirectory?: string;
}

export interface AOSessionCorrelation {
  taskId: string;
  runId: string;
  architectureId: string;
  architectureVersion: number;
  agentId: string;
  agentName: string;
  sessionId: string;
  aoSessionId: string;
  aoProjectId: string;
  worktreeBranch?: string;
  worktreePath?: string;
  reservationId: string;
  harness: string;
  status: string;
  createdAt: number;
  updatedAt: number;
}
