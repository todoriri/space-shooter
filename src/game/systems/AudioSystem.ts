// Audio System for Entity-Component-System architecture
// Listens for game events and plays appropriate sounds

import { GameAudio } from '../../utils/AudioManager';

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

  switch (event.type) {
    // Player actions
    case 'playerShoot':
      GameAudio.playPlayerShoot();
      break;

    case 'playerHit':
      if (event.data && event.data.fatal) {
        GameAudio.playGameOver();
      } else {
        GameAudio.playPlayerHit();
      }
      break;

    // Enemy actions
    case 'enemyShoot':
      GameAudio.playEnemyShoot();
      break;

    case 'enemyDestroyed':
      GameAudio.playExplosion();
      break;

    // Collision events
    case 'collision':
      handleCollisionSound(event.data);
      break;

    // Power-up events
    case 'powerUpCollect':
      GameAudio.playPowerUpCollect();
      break;

    case 'powerUpActivated':
      // Optional: Play power-up activation sound
      break;

    case 'powerUpExpired':
      // Optional: Play power-up expiration sound
      break;

    // Game state events
    case 'gameStart':
      GameAudio.playBackgroundMusic();
      break;

    case 'gamePause':
      // Pause audio when game is paused
      GameAudio.stopAllGameSounds();
      break;

    case 'gameResume':
      // Resume audio when game resumes
      GameAudio.playBackgroundMusic();
      break;

    case 'gameOver':
      GameAudio.playGameOver();
      GameAudio.stopAllGameSounds();
      break;

    // UI events
    case 'menuSelect':
      GameAudio.playMenuSelect();
      break;

    case 'menuConfirm':
      GameAudio.playMenuConfirm();
      break;

    // Wave events
    case 'waveComplete':
      // Optional: Play wave complete sound
      break;

    case 'bossSpawn':
      // Optional: Play boss spawn sound
      break;

    case 'bossDefeated':
      GameAudio.playExplosion();
      // Optional: Play special boss defeat sound
      break;
  }
};

// Handle collision sounds based on collision type
const handleCollisionSound = (data: any): void => {
  if (!data || !data.collisionType) return;

  switch (data.collisionType) {
    case 'player-enemy':
      GameAudio.playPlayerHit();
      GameAudio.playExplosion();
      break;

    case 'bullet-enemy':
      GameAudio.playExplosion();
      break;

    case 'bullet-player':
      GameAudio.playPlayerHit();
      break;

    case 'player-powerUp':
      GameAudio.playPowerUpCollect();
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
    console.log('Audio system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize audio system:', error);
  }
};

// Audio system cleanup
export const cleanupAudioSystem = (): void => {
  GameAudio.stopAllGameSounds();
  console.log('Audio system cleaned up');
};

// Audio system controls
export const AudioControls = {
  // Set audio volumes
  setVolumes(music: number, sfx: number, ui: number): void {
    GameAudio.setGameVolumes(music, sfx, ui);
  },

  // Mute all audio
  mute(): void {
    // This would be handled by the AudioManager
    console.log('Audio muted');
  },

  // Unmute all audio
  unmute(): void {
    // This would be handled by the AudioManager
    console.log('Audio unmuted');
  },

  // Check if audio is muted
  isMuted(): boolean {
    // This would be handled by the AudioManager
    return false;
  },

  // Play test sound
  playTestSound(): void {
    GameAudio.playPlayerShoot();
  },
};