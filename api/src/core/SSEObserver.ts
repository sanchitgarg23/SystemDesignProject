import { Response } from 'express';
import { IObserver } from './EventBus';

/**
 * SSEObserver — Concrete Observer for Server-Sent Events
 * 
 * Wraps an Express Response object to implement the IObserver interface.
 * When the EventBus (Subject) notifies this observer, it writes the data
 * as an SSE event to the client's HTTP response stream.
 * 
 * Design Pattern: Observer (Concrete Observer)
 * 
 * Usage:
 *   const observer = new SSEObserver(clientId, res);
 *   EventBus.getInstance().subscribe('bus-updates', observer);
 */
export class SSEObserver implements IObserver {
  public readonly id: string;
  private response: Response;
  private active: boolean;

  constructor(id: string, response: Response) {
    this.id = id;
    this.response = response;
    this.active = true;
  }

  /**
   * Called by the EventBus when new data is available.
   * Writes the data as an SSE-formatted message to the client stream.
   */
  public update(event: string, data: any): void {
    if (!this.active) {
      throw new Error(`SSEObserver ${this.id} is no longer active`);
    }

    try {
      this.response.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      this.active = false;
      throw error; // EventBus will unsubscribe this observer
    }
  }

  /**
   * Send a named SSE event to the client.
   */
  public sendEvent(eventName: string, data: any): void {
    if (!this.active) return;

    try {
      this.response.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      this.active = false;
    }
  }

  /**
   * Send an SSE comment (used for keep-alive heartbeats).
   */
  public sendHeartbeat(): void {
    if (!this.active) return;

    try {
      this.response.write(`:heartbeat\n\n`);
    } catch {
      this.active = false;
    }
  }

  /**
   * Mark this observer as inactive (client disconnected).
   */
  public deactivate(): void {
    this.active = false;
  }

  /**
   * Check if this observer is still active.
   */
  public isActive(): boolean {
    return this.active;
  }
}
