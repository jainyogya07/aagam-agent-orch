// ============================================================
// Persistent Database-Backed Session — Agent Resource Exchange
// ============================================================
// Implements the official @openai/agents `Session` interface.
// Backed by persistent file / DB storage so process crashes or restarts
// preserve exact session state.
// ============================================================

import fs from 'fs';
import path from 'path';
import type { Session, AgentInputItem } from '@openai/agents';

export interface PersistentSessionOptions {
  sessionId: string;
  storageDir?: string;
}

export class PersistentDBSession implements Session {
  private readonly sessionId: string;
  private readonly filePath: string;
  private items: AgentInputItem[] = [];
  private isLoaded = false;

  constructor(options: PersistentSessionOptions) {
    this.sessionId = options.sessionId;
    const baseDir = options.storageDir ?? path.join(process.cwd(), '.agent_sessions');
    if (!fs.existsSync(baseDir)) {
      try {
        fs.mkdirSync(baseDir, { recursive: true });
      } catch {
        // Fallback for restricted environments
      }
    }
    this.filePath = path.join(baseDir, `${this.sessionId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    if (this.isLoaded) return;
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        this.items = JSON.parse(raw);
      }
    } catch {
      this.items = [];
    }
    this.isLoaded = true;
  }

  private persistToDisk(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.items, null, 2), 'utf8');
    } catch (err) {
      // Non-fatal write failure in sandbox environments
      console.warn(`[PersistentDBSession] Could not write session to disk: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  public async getSessionId(): Promise<string> {
    return this.sessionId;
  }

  public async getItems(limit?: number): Promise<AgentInputItem[]> {
    this.loadFromDisk();
    if (typeof limit === 'number' && limit > 0) {
      return this.items.slice(-limit);
    }
    return [...this.items];
  }

  public async addItems(items: AgentInputItem[]): Promise<void> {
    this.loadFromDisk();
    this.items.push(...items);
    this.persistToDisk();
  }

  public async popItem(): Promise<AgentInputItem | undefined> {
    this.loadFromDisk();
    const popped = this.items.pop();
    this.persistToDisk();
    return popped;
  }

  public async clearSession(): Promise<void> {
    this.items = [];
    this.persistToDisk();
  }
}
