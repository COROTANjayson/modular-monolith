/**
 * Shared Infrastructure - Event Bus
 *
 * Typed singleton event emitter for decoupled inter-module communication.
 * Any module can emit/listen to domain events without direct coupling.
 *
 * Usage:
 *   eventBus.emit('notification.created', notification);
 *   eventBus.on('notification.created', handler);
 */

import { EventEmitter } from "events";

export interface AppEvents {
  "notification.created": [payload: { id: string; userId: string; type: string; title: string; message: string; metadata?: any }];
  "member.invited": [payload: { organizationId: string; organizationName: string; inviterId: string; email: string; role: string; targetUserId?: string; token: string }];
}

class EventBus {
  private emitter = new EventEmitter();

  constructor() {
    // Allow many listeners (each SSE/WS connection adds one)
    this.emitter.setMaxListeners(0);
  }

  emit<K extends keyof AppEvents>(event: K, ...args: AppEvents[K]): void {
    this.emitter.emit(event as string, ...args);
  }

  on<K extends keyof AppEvents>(event: K, handler: (...args: AppEvents[K]) => void): void {
    this.emitter.on(event as string, handler as any);
  }

  off<K extends keyof AppEvents>(event: K, handler: (...args: AppEvents[K]) => void): void {
    this.emitter.off(event as string, handler as any);
  }
}

export const eventBus = new EventBus();
