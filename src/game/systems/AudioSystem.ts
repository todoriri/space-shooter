// Audio System for Entity-Component-System architecture
// Listens for game events and plays appropriate sounds

import { GameAudio } from '../../utils/AudioManager';
import { audioLog } from '../../utils/Debug';

// Audio system status
export interface AudioSystemStatus {
  isInitialized: boolean;
  isMuted: boolean;
  musicVolume: number;
  sfxVolume: number;
  lastError: string | null;
}

// Global audio status (for UI access)
let audioStatus: AudioSystemStatus = {
  isInitialized: false,
  isMuted: false,
  musicVolume: 1.0,
  sfxVolume: 1.0,
  lastError: null,
};

// Status listeners
const statusListeners: Set<(status: AudioSystemStatus) => void> = new Set();

/**
 * Subscribe to audio status changes
 */
export const subscribeToAudioStatus = (listener: (status: AudioSystemStatus) => void): (() => void) => {
  statusListeners.add(listener);
  // Immediately notify with current status
  listener({ ...audioStatus });
  return () => statusListeners.delete(listener);
};

/**
 * Get current audio status
 */
export const getAudioStatus = (): AudioSystemStatus => ({ ...audioStatus });

/**
 * Update audio status and notify listeners
 */
const updateStatus = (updates: Partial<AudioSystemStatus>): void => {
  audioStatus = { ...audioStatus, ...updates };
  statusListeners.forEach(listener => listener({ ...audioStatus }));
};

/**
 * Safe audio execution wrapper - catches errors and updates status
 */
const safeAudio = (operation: string, fn: () => void): void => {
  try {
    fn();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    audioLog.error(`Audio error (${operation}):`, errorMessage);
    updateStatus({ lastError: errorMessage });
  }
};

// System function that processes audio events
export const AudioSystem = (
  entities: Record<string, any>,
  { dispatch, events }: { dispatch: (event: any) => void; events?: any[] }
) => {
  // Process audio events if any
  if (events && events.length > 0) {
    events.forEach(event => {
      handleAudioEvent(event);
    });
  }

  return entities;
};

// Handle audio events based on game events
const handleAudioEvent = (event: any): void => {
  if (!event || !event.type) return;

  // Skip if audio is muted
  if (audioStatus.isMuted && event.type !== 'gameStart') {
    return;
  }

  switch (event.type) {
    // Player actions
    case 'playerShoot':
      safeAudio('playerShoot', () => GameAudio.playPlayerShoot());
      break;

    case 'playerHit':
      safeAudio('playerHit', () => {
        if (event.data && event.data.fatal) {
          GameAudio.playGameOver();
        } else {
          GameAudio.playPlayerHit();
        }
      });
      break;

    // Enemy actions
    case 'enemyShoot':
      safeAudio('enemyShoot', () => GameAudio.playEnemyShoot());
      break;

    case 'enemyDestroyed':
      safeAudio('enemyDestroyed', () => GameAudio.playExplosion());
      break;

    // Collision events
    case 'collision':
      handleCollisionSound(event.data);
      break;

    // Power-up events
    case 'powerUpCollect':
      safeAudio('powerUpCollect', () => GameAudio.playPowerUpCollect());
      break;

    case 'powerUpActivated':
      // Optional: Play power-up activation sound
      break;

    case 'powerUpExpired':
      // Optional: Play power-up expiration sound
      break;

    // Game state events
    case 'gameStart':
      safeAudio('gameStart', () => GameAudio.playBackgroundMusic());
      break;

    case 'gamePause':
      // Pause audio when game is paused
      safeAudio('gamePause', () => GameAudio.stopAllGameSounds());
      break;

    case 'gameResume':
      // Resume audio when game resumes
      safeAudio('gameResume', () => GameAudio.playBackgroundMusic());
      break;

    case 'gameOver':
      safeAudio('gameOver', () => {
        GameAudio.playGameOver();
        GameAudio.stopAllGameSounds();
      });
      break;

    // UI events
    case 'menuSelect':
      safeAudio('menuSelect', () => GameAudio.playMenuSelect());
      break;

    case 'menuConfirm':
      safeAudio('menuConfirm', () => GameAudio.playMenuConfirm());
      break;

    // Wave events
    case 'waveComplete':
      // Optional: Play wave complete sound
      break;

    case 'bossSpawn':
      // Optional: Play boss spawn sound
      break;

    case 'bossDefeated':
      safeAudio('bossDefeated', () => GameAudio.playExplosion());
      break;
  }
};

// Handle collision sounds based on collision type
const handleCollisionSound = (data: any): void => {
  if (!data || !data.collisionType) return;

  switch (data.collisionType) {
    case 'player-enemy':
      safeAudio('player-enemy collision', () => {
        GameAudio.playPlayerHit();
        GameAudio.playExplosion();
      });
      break;

    case 'bullet-enemy':
      safeAudio('bullet-enemy collision', () => GameAudio.playExplosion());
      break;

    case 'bullet-player':
      safeAudio('bullet-player collision', () => GameAudio.playPlayerHit());
      break;

    case 'player-powerUp':
      safeAudio('player-powerUp collision', () => GameAudio.playPowerUpCollect());
      break;

    case 'enemy-enemy':
      // Optional: Play enemy collision sound
      break;
  }
};

// Audio system initialization
export const initializeAudioSystem = async (): Promise<void> => {
  try {
    // Preload game sounds
    await GameAudio.preloadGameSounds();
    updateStatus({ isInitialized: true, lastError: null });
    audioLog.log('Audio system initialized successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    audioLog.error('Failed to initialize audio system:', errorMessage);
    updateStatus({ isInitialized: false, lastError: errorMessage });
    throw error; // Re-throw so caller can handle
  }
};

// Audio system cleanup
export const cleanupAudioSystem = (): void => {
  try {
    GameAudio.stopAllGameSounds();
    updateStatus({ isInitialized: false });
    audioLog.log('Audio system cleaned up');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    audioLog.error('Error during audio cleanup:', errorMessage);
    updateStatus({ lastError: errorMessage });
  }
};

// Audio system controls
export const AudioControls = {
  // Set audio volumes
  setVolumes(music: number, sfx: number, ui: number): void {
    safeAudio('setVolumes', () => {
      GameAudio.setGameVolumes(music, sfx, ui);
      updateStatus({ musicVolume: music, sfxVolume: sfx });
    });
  },

  // Mute all audio
  mute(): void {
    updateStatus({ isMuted: true });
    safeAudio('mute', () => GameAudio.stopAllGameSounds());
    audioLog.log('Audio muted');
  },

  // Unmute all audio
  unmute(): void {
    updateStatus({ isMuted: false });
    audioLog.log('Audio unmuted');
  },

  // Toggle mute
  toggleMute(): boolean {
    if (audioStatus.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return audioStatus.isMuted;
  },

  // Check if audio is muted
  isMuted(): boolean {
    return audioStatus.isMuted;
  },

  // Check if audio is initialized
  isInitialized(): boolean {
    return audioStatus.isInitialized;
  },

  // Get current error (if any)
  getLastError(): string | null {
    return audioStatus.lastError;
  },

  // Clear error
  clearError(): void {
    updateStatus({ lastError: null });
  },

  // Play test sound
  playTestSound(): void {
    safeAudio('testSound', () => GameAudio.playPlayerShoot());
  },
};