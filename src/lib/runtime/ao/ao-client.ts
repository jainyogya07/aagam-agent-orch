// ============================================================
// AO Daemon Client — Agent Resource Exchange
// ============================================================
// Direct client for interacting with the local Agent Orchestrator
// desktop daemon (port 3001) and CLI (`ao`).
// All operations are scoped to local execution and project isolation.
// ============================================================

import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { promisify } from 'util';
import type {
  AOSession,
  AOSpawnOptions,
  AOHarnessInfo,
  AODaemonHealth,
} from './ao-types';

const execFileAsync = promisify(execFile);

function resolveAoBin(): string {
  if (process.env.AO_BIN) return process.env.AO_BIN;
  const bundled = '/Applications/Agent Orchestrator.app/Contents/Resources/daemon/ao';
  if (existsSync(bundled)) return bundled;
  return 'ao';
}

export class AOClient {
  private static readonly DAEMON_PORT = 3001;
  private static readonly DAEMON_URL = `http://127.0.0.1:${AOClient.DAEMON_PORT}`;
  private static readonly AO_BIN = resolveAoBin();

  /**
   * Fast health check against local AO desktop daemon.
   */
  public static async checkDaemonHealth(): Promise<AODaemonHealth> {
    try {
      const response = await fetch(`${this.DAEMON_URL}/healthz`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        const data = (await response.json()) as Record<string, unknown>;
        return {
          status: 'ok',
          service: String(data.service ?? 'agent-orchestrator-daemon'),
          pid: Number(data.pid ?? 0),
          startupWorkingDirectory: String(data.startupWorkingDirectory ?? ''),
          workingDirectory: String(data.workingDirectory ?? ''),
        };
      }
    } catch {
      // Daemon HTTP unreachable, fallback to CLI status check
    }

    try {
      const { stdout } = await execFileAsync(this.AO_BIN, ['status'], {
        timeout: 4000,
      });
      const isReady = stdout.includes('ready') || stdout.includes('healthz: ok');
      return {
        status: isReady ? 'ok' : 'stopped',
      };
    } catch (err) {
      return {
        status: 'error',
      };
    }
  }

  /**
   * Lists supported and installed agent harnesses (Codex, Cursor, Kiro, etc.)
   */
  public static async listSupportedHarnesses(): Promise<{
    supported: AOHarnessInfo[];
    installed: AOHarnessInfo[];
    authorized: AOHarnessInfo[];
  }> {
    try {
      const { stdout } = await execFileAsync(
        this.AO_BIN,
        ['agent', 'ls', '--refresh', '--json'],
        { timeout: 8000 }
      );
      const data = JSON.parse(stdout);
      return {
        supported: (data.supported ?? []) as AOHarnessInfo[],
        installed: (data.installed ?? []) as AOHarnessInfo[],
        authorized: (data.authorized ?? []) as AOHarnessInfo[],
      };
    } catch (err) {
      console.warn(`[AOClient] listSupportedHarnesses error: ${err instanceof Error ? err.message : String(err)}`);
      return { supported: [], installed: [], authorized: [] };
    }
  }

  /**
   * Spawns an isolated session in the registered project (e.g. 'aagam').
   */
  public static async spawnSession(options: AOSpawnOptions): Promise<{ sessionId: string; rawOutput: string }> {
    const project = options.project || 'aagam';
    const name = options.name.slice(0, 20); // max 20 chars
    const args: string[] = ['spawn', '--project', project, '--name', name];

    if (options.harness) {
      args.push('--harness', options.harness);
    }
    if (options.kind) {
      args.push('--kind', options.kind);
    }
    if (options.mode) {
      args.push('--mode', options.mode);
    }
    if (options.model) {
      args.push('--model', options.model);
    }
    if (options.branch) {
      args.push('--branch', options.branch);
    }
    if (options.prompt) {
      args.push('--prompt', options.prompt);
    }

    const { stdout, stderr } = await execFileAsync(this.AO_BIN, args, {
      timeout: 30000,
    });

    const combinedOutput = `${stdout}\n${stderr}`;

    // Extract session id: e.g. "Session aagam-3 created" or match regex `aagam-\d+`
    const match = combinedOutput.match(/(aagam-\d+|scratch-\d+)/i);
    let sessionId = match ? match[1] : '';

    if (!sessionId) {
      // Query recent sessions from project to identify the newly spawned session
      const recent = await this.listSessions(project, true);
      if (recent.length > 0) {
        sessionId = recent[0].id;
      }
    }

    if (!sessionId) {
      throw new Error(`Failed to parse spawned session ID from AO: ${combinedOutput}`);
    }

    return { sessionId, rawOutput: combinedOutput };
  }

  /**
   * Fetches detailed state of an AO session.
   */
  public static async getSession(sessionId: string, project = 'aagam'): Promise<AOSession | null> {
    try {
      const { stdout } = await execFileAsync(
        this.AO_BIN,
        ['session', 'get', sessionId, '-p', project, '--json'],
        { timeout: 5000 }
      );
      const parsed = JSON.parse(stdout);
      return (parsed.session ?? parsed) as AOSession;
    } catch (err) {
      console.warn(`[AOClient] getSession(${sessionId}) error: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  /**
   * Sends a message or prompt instruction to a running session.
   */
  public static async sendMessage(sessionId: string, message: string): Promise<boolean> {
    try {
      await execFileAsync(
        this.AO_BIN,
        ['send', '--session', sessionId, '--message', message],
        { timeout: 10000 }
      );
      return true;
    } catch (err) {
      console.error(`[AOClient] sendMessage(${sessionId}) error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  /**
   * Terminates an active session and triggers worktree cleanup.
   */
  public static async killSession(sessionId: string, project = 'aagam'): Promise<boolean> {
    try {
      await execFileAsync(
        this.AO_BIN,
        ['session', 'kill', sessionId, '-p', project],
        { timeout: 10000 }
      );
      return true;
    } catch (err) {
      console.warn(`[AOClient] killSession(${sessionId}) error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  /**
   * Relaunches/restores a terminated session.
   */
  public static async restoreSession(sessionId: string): Promise<boolean> {
    try {
      await execFileAsync(
        this.AO_BIN,
        ['session', 'restore', sessionId],
        { timeout: 10000 }
      );
      return true;
    } catch (err) {
      console.warn(`[AOClient] restoreSession(${sessionId}) error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  /**
   * Lists all sessions for a project.
   */
  public static async listSessions(project = 'aagam', includeTerminated = false): Promise<AOSession[]> {
    try {
      const args = ['session', 'ls', '-p', project, '--all', '--json'];
      if (includeTerminated) {
        args.push('--include-terminated');
      }
      const { stdout } = await execFileAsync(this.AO_BIN, args, {
        timeout: 6000,
      });
      const parsed = JSON.parse(stdout);
      const raw = (parsed.data ?? parsed.sessions ?? (Array.isArray(parsed) ? parsed : [])) as Array<
        Record<string, unknown>
      >;
      const listed = raw.map((s) => ({
        ...(s as unknown as AOSession),
        id: String(s.id ?? ''),
        displayName: String(s.displayName ?? s.name ?? s.id ?? ''),
        harness: String(s.harness ?? ''),
        status: String(s.status ?? 'unknown'),
        isTerminated: Boolean(s.isTerminated),
      })) as AOSession[];

      const toEnrich = listed.filter((s) => includeTerminated || !s.isTerminated).slice(0, 32);
      const details = await Promise.all(toEnrich.map((s) => this.getSession(s.id, project)));
      return listed.map((s) => {
        const full = details.find((d) => d?.id === s.id);
        if (!full) return s;
        return {
          ...s,
          ...full,
          displayName: full.displayName || s.displayName,
        };
      });
    } catch (err) {
      console.warn(`[AOClient] listSessions(${project}) error: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }
}
