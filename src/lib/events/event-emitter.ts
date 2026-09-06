// ============================================================
// Event Bus — Agent Resource Exchange
// ============================================================
// In-memory event bus with per-run history.
// All system components emit events through this bus.
// SSE endpoint subscribes to stream events to the frontend.
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import type { SystemEvent, SystemEventType, EventListener, EventBus } from '@/lib/types/events';
import { db, schema } from '@/lib/db';

class SystemEventBus implements EventBus {
  private listeners = new Map<string, Set<EventListener>>();
  private history = new Map<string, SystemEvent[]>();

  emit(event: SystemEvent): void {
    // Ensure event has an ID and timestamp
    if (!event.id) event.id = uuidv4();
    if (!event.timestamp) event.timestamp = Date.now();

    // Store in history
    const runEvents = this.history.get(event.runId) || [];
    runEvents.push(event);
    this.history.set(event.runId, runEvents);

    // Asynchronously persist to PostgreSQL
    db.insert(schema.events).values({
      id: event.id,
      runId: event.runId,
      eventType: event.type,
      payload: event.payload as Record<string, unknown>,
    }).catch(() => {
      // Fail-safe: memory bus and SSE continue seamlessly if DB is busy
    });

    // Notify type-specific listeners
    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      for (const listener of typeListeners) {
        try {
          listener(event);
        } catch (err) {
          console.error(`[EventBus] Listener error for ${event.type}:`, err);
        }
      }
    }

    // Notify wildcard listeners
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      for (const listener of wildcardListeners) {
        try {
          listener(event);
        } catch (err) {
          console.error(`[EventBus] Wildcard listener error:`, err);
        }
      }
    }
  }

  on(type: SystemEventType | '*', listener: EventListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);

    // Return unsubscribe function
    return () => this.off(type, listener);
  }

  off(type: SystemEventType | '*', listener: EventListener): void {
    const set = this.listeners.get(type);
    if (set) {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  getHistory(runId: string): SystemEvent[] {
    return this.history.get(runId) || [];
  }

  clear(runId: string): void {
    this.history.delete(runId);
  }

  /**
   * Helper: emit a log event with a message
   */
  log(runId: string, level: 'info' | 'warn' | 'error', message: string, extra?: Record<string, unknown>): void {
    this.emit({
      id: uuidv4(),
      runId,
      type: `log.${level}` as SystemEventType,
      timestamp: Date.now(),
      payload: { message, ...extra },
    });
  }
}

// Singleton event bus
export const eventBus = new SystemEventBus();
