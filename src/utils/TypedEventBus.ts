/**
 * Typed Event Bus for Space Shooter Game
 * Provides type-safe event dispatching and handling
 */

// Event type definitions with their data payloads
export type GameEventMap = {
  // Player events
  playerShoot: {
    playerId: string;
    position: { x: number; y: number };
    bulletType: 'normal' | 'rapid' | 'spread';
  };
  playerHit: {
    playerId: string;
    damage: number;
    fatal: boolean;
    source: 'enemy' | 'bullet' | 'collision';
  };
  playerBomb: {
    playerId: string;
    position: { x: number; y: number };
    radius: number;
  };

  // Enemy events
  enemyShoot: {
    enemyId: string;
    position: { x: number; y: number };
    bulletType: string;
  };
  enemyDestroyed: {
    enemyId: string;
    enemyType: string;
    position: { x: number; y: number };
    points: number;
  };

  // Collision events
  collision: {
    collisionType: 'player-enemy' | 'bullet-enemy' | 'bullet-player' | 'player-powerUp' | 'enemy-enemy';
    entity1Id: string;
    entity2Id: string;
    position: { x: number; y: number };
  };

  // Power-up events
  powerUpCollect: {
    playerId: string;
    powerUpId: string;
    powerUpType: 'shield' | 'rapidFire' | 'multiShot' | 'bomb' | 'health' | 'score';
    duration?: number;
    value?: number;
  };
  powerUpActivated: {
    playerId: string;
    powerUpType: string;
    duration: number;
  };
  powerUpExpired: {
    playerId: string;
    powerUpType: string;
  };

  // Wave events
  waveComplete: {
    waveNumber: number;
    enemiesDefeated: number;
    bonusPoints: number;
  };
  waveStart: {
    waveNumber: number;
    enemyCount: number;
    isBossWave: boolean;
  };
  bossSpawn: {
    bossId: string;
    bossType: string;
    health: number;
  };
  bossDefeated: {
    bossId: string;
    bossType: string;
    points: number;
  };

  // Game state events
  gameStart: {
    difficulty: 'easy' | 'medium' | 'hard';
  };
  gamePause: undefined;
  gameResume: undefined;
  gameOver: {
    reason: 'noLives' | 'timeUp' | 'bossDefeated' | 'unknown';
    finalScore: number;
    wave: number;
  };

  // UI events
  menuSelect: {
    menuItem: string;
  };
  menuConfirm: {
    action: string;
  };

  // Particle/visual events
  particleExplosion: {
    position: { x: number; y: number };
    particleCount: number;
    color: string;
  };
  screenShake: {
    intensity: number;
    duration: number;
  };
};

// Typed event interface
export type TypedGameEvent<K extends keyof GameEventMap = keyof GameEventMap> = {
  type: K;
  data: GameEventMap[K];
  timestamp: number;
};

// Event handler type
export type EventHandler<K extends keyof GameEventMap> = (
  event: TypedGameEvent<K>
) => void;

// Event queue for processing
type EventQueueEntry = {
  event: TypedGameEvent;
  priority: number;
};

/**
 * TypedEventBus - Type-safe event management system
 */
class TypedEventBus {
  private handlers: Map<keyof GameEventMap, Set<EventHandler<any>>> = new Map();
  private eventQueue: EventQueueEntry[] = [];
  private isProcessing = false;
  private maxQueueSize = 100;

  /**
   * Subscribe to a specific event type
   */
  on<K extends keyof GameEventMap>(
    eventType: K,
    handler: EventHandler<K>
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Subscribe to a specific event type (one-time)
   */
  once<K extends keyof GameEventMap>(
    eventType: K,
    handler: EventHandler<K>
  ): () => void {
    const wrappedHandler: EventHandler<K> = (event) => {
      this.off(eventType, wrappedHandler);
      handler(event);
    };
    return this.on(eventType, wrappedHandler);
  }

  /**
   * Unsubscribe from a specific event type
   */
  off<K extends keyof GameEventMap>(
    eventType: K,
    handler: EventHandler<K>
  ): void {
    this.handlers.get(eventType)?.delete(handler);
  }

  /**
   * Dispatch an event immediately
   */
  emit<K extends keyof GameEventMap>(
    eventType: K,
    data: GameEventMap[K]
  ): void {
    const event: TypedGameEvent<K> = {
      type: eventType,
      data,
      timestamp: Date.now(),
    };

    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Queue an event for later processing
   */
  queue<K extends keyof GameEventMap>(
    eventType: K,
    data: GameEventMap[K],
    priority: number = 0
  ): void {
    if (this.eventQueue.length >= this.maxQueueSize) {
      console.warn('Event queue full, dropping oldest event');
      this.eventQueue.shift();
    }

    const event: TypedGameEvent<K> = {
      type: eventType,
      data,
      timestamp: Date.now(),
    };

    this.eventQueue.push({ event, priority });
    this.eventQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Process all queued events
   */
  processQueue(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;
    try {
      while (this.eventQueue.length > 0) {
        const entry = this.eventQueue.shift()!;
        this.emit(entry.event.type, entry.event.data);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Clear all handlers for a specific event type
   */
  clearHandlers(eventType?: keyof GameEventMap): void {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
    }
  }

  /**
   * Clear the event queue
   */
  clearQueue(): void {
    this.eventQueue = [];
  }

  /**
   * Get the number of queued events
   */
  getQueueLength(): number {
    return this.eventQueue.length;
  }

  /**
   * Check if there are any handlers for an event type
   */
  hasHandlers(eventType: keyof GameEventMap): boolean {
    const handlers = this.handlers.get(eventType);
    return handlers !== undefined && handlers.size > 0;
  }
}

// Singleton instance
export const gameEventBus = new TypedEventBus();

// Convenience hooks for React components
import { useEffect, useCallback } from 'react';

/**
 * React hook for subscribing to game events
 */
export function useGameEvent<K extends keyof GameEventMap>(
  eventType: K,
  handler: EventHandler<K>,
  deps: any[] = []
): void {
  useEffect(() => {
    const unsubscribe = gameEventBus.on(eventType, handler);
    return unsubscribe;
  }, [eventType, ...deps]);
}

/**
 * React hook for emitting game events
 */
export function useGameEmitter() {
  return useCallback(<K extends keyof GameEventMap>(
    eventType: K,
    data: GameEventMap[K]
  ) => {
    gameEventBus.emit(eventType, data);
  }, []);
}

export default TypedEventBus;
