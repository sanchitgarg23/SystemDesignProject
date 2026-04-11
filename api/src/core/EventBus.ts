/**
 * Observer Pattern Implementation — Event Bus
 * 
 * Implements the Gang of Four Observer (Publish-Subscribe) Pattern for
 * decoupled real-time event distribution across the system.
 * 
 * ISubject (EventBus) maintains a registry of IObserver instances per channel.
 * When state changes (e.g., new GPS heartbeat), the Subject notifies all
 * subscribed Observers on the relevant channel.
 * 
 * Also implements Singleton Pattern — only one EventBus exists system-wide.
 * 
 * Design Patterns: Observer + Singleton
 */

/**
 * Observer Interface
 * 
 * Any class that wants to receive real-time updates must implement this.
 * The `update` method is called by the Subject when new data is available.
 */
export interface IObserver {
  /** Unique identifier for this observer instance */
  readonly id: string;
  /** Called by the Subject when an event occurs on the subscribed channel */
  update(event: string, data: any): void;
}

/**
 * Subject Interface
 * 
 * Defines the contract for managing observer subscriptions and notifications.
 */
export interface ISubject {
  /** Register an observer to a specific event channel */
  subscribe(channel: string, observer: IObserver): void;
  /** Remove an observer from a specific event channel */
  unsubscribe(channel: string, observer: IObserver): void;
  /** Push data to all observers on a specific channel */
  notify(channel: string, data: any): void;
}

/**
 * EventBus — Central Pub/Sub Hub (Singleton + Subject)
 * 
 * Used primarily for Server-Sent Events (SSE) to push real-time bus
 * tracking updates to connected admin dashboards and passenger apps.
 * 
 * Usage:
 *   const bus = EventBus.getInstance();
 *   bus.subscribe('bus-updates', observer);
 *   bus.notify('bus-updates', { lat: 30.7, lng: 76.7 });
 */
export class EventBus implements ISubject {
  private static instance: EventBus;
  private channels: Map<string, Set<IObserver>>;

  private constructor() {
    this.channels = new Map();
  }

  /**
   * Returns the single EventBus instance.
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe an observer to a named channel.
   */
  public subscribe(channel: string, observer: IObserver): void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(observer);
    console.log(`Observer ${observer.id} subscribed to channel: ${channel}`);
  }

  /**
   * Unsubscribe an observer from a named channel.
   */
  public unsubscribe(channel: string, observer: IObserver): void {
    const channelObservers = this.channels.get(channel);
    if (channelObservers) {
      channelObservers.delete(observer);
      console.log(`Observer ${observer.id} unsubscribed from channel: ${channel}`);

      // Clean up empty channels
      if (channelObservers.size === 0) {
        this.channels.delete(channel);
      }
    }
  }

  /**
   * Notify all observers on a channel with new data.
   * Failed observers are automatically unsubscribed (e.g., disconnected clients).
   */
  public notify(channel: string, data: any): void {
    const channelObservers = this.channels.get(channel);
    if (!channelObservers) return;

    const failedObservers: IObserver[] = [];

    for (const observer of channelObservers) {
      try {
        observer.update(channel, data);
      } catch (error) {
        console.error(`Failed to notify observer ${observer.id}:`, error);
        failedObservers.push(observer);
      }
    }

    // Remove failed observers
    for (const failed of failedObservers) {
      this.unsubscribe(channel, failed);
    }
  }

  /**
   * Get the count of observers on a specific channel.
   */
  public getObserverCount(channel: string): number {
    return this.channels.get(channel)?.size || 0;
  }

  /**
   * Get all active channel names.
   */
  public getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}
