// Audio Manager for Space Shooter game
// Uses react-native-sound for audio playback with mobile optimization

import Sound from 'react-native-sound';
import { Platform } from 'react-native';

// Enable audio in silence mode (iOS)
Sound.setCategory('Playback');

// Audio file types
export type AudioFileType = 'music' | 'sfx' | 'ui';

// Audio configuration
export interface AudioConfig {
  volume: number;
  loop: boolean;
  pan?: number;
  speed?: number;
}

// Default audio configurations
const DEFAULT_CONFIGS: Record<AudioFileType, AudioConfig> = {
  music: { volume: 0.7, loop: true },
  sfx: { volume: 0.8, loop: false },
  ui: { volume: 0.6, loop: false },
};

// Sound instances cache
const soundCache: Map<string, Sound> = new Map();

// Audio Manager class
class AudioManager {
  private static instance: AudioManager;
  private isMuted: boolean = false;
  private masterVolume: number = 1.0;
  private musicVolume: number = 0.7;
  private sfxVolume: number = 0.8;
  private uiVolume: number = 0.6;
  private currentMusic: string | null = null;

  private constructor() {
    // Initialize audio system
    this.setupAudio();
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // Setup audio system
  private setupAudio(): void {
    // Configure audio for mobile platforms
    if (Platform.OS === 'ios') {
      // iOS specific audio setup
      Sound.setCategory('Playback', true); // Mix with other audio
    } else if (Platform.OS === 'android') {
      // Android specific audio setup
      Sound.setCategory('Playback');
    }
  }

  // Preload audio files
  async preloadSounds(soundMap: Record<string, any>): Promise<void> {
    const promises = Object.entries(soundMap).map(([key, soundFile]) => {
      return this.loadSound(key, soundFile);
    });

    await Promise.all(promises);
  }

  // Load a sound file
  async loadSound(key: string, soundFile: any, type: AudioFileType = 'sfx'): Promise<boolean> {
    return new Promise((resolve) => {
      // Check if sound is already loaded
      if (soundCache.has(key)) {
        console.log(`Sound ${key} already loaded`);
        resolve(true);
        return;
      }

      const config = DEFAULT_CONFIGS[type];

      const sound = new Sound(soundFile, (error) => {
        if (error) {
          console.error(`Failed to load sound ${key}:`, error);
          resolve(false);
          return;
        }

        // Configure sound
        sound.setVolume(this.getAdjustedVolume(config.volume, type));
        sound.setPan(config.pan || 0);
        if (config.speed) {
          sound.setSpeed(config.speed);
        }

        // Cache the sound
        soundCache.set(key, sound);
        console.log(`Sound ${key} loaded successfully`);
        resolve(true);
      });
    });
  }

  // Play a sound
  playSound(key: string, config?: Partial<AudioConfig>): void {
    if (this.isMuted) return;

    const sound = soundCache.get(key);
    if (!sound) {
      console.warn(`Sound ${key} not found in cache`);
      return;
    }

    // Stop if currently playing
    if (sound.isPlaying()) {
      sound.stop();
    }

    // Apply configuration
    const defaultConfig = DEFAULT_CONFIGS[this.getSoundType(key)];
    const finalConfig = { ...defaultConfig, ...config };

    sound.setVolume(this.getAdjustedVolume(finalConfig.volume, this.getSoundType(key)));
    sound.setPan(finalConfig.pan || 0);
    if (finalConfig.speed) {
      sound.setSpeed(finalConfig.speed);
    }

    // Play the sound
    sound.play((success) => {
      if (!success) {
        console.error(`Failed to play sound ${key}`);
      }
    });
  }

  // Play music (stops current music if playing)
  playMusic(key: string, config?: Partial<AudioConfig>): void {
    if (this.isMuted) return;

    // Stop current music
    if (this.currentMusic && this.currentMusic !== key) {
      this.stopSound(this.currentMusic);
    }

    const sound = soundCache.get(key);
    if (!sound) {
      console.warn(`Music ${key} not found in cache`);
      return;
    }

    // Configure music
    const finalConfig = { ...DEFAULT_CONFIGS.music, ...config, loop: true };
    sound.setVolume(this.getAdjustedVolume(finalConfig.volume, 'music'));
    sound.setPan(finalConfig.pan || 0);

    // Play music
    sound.play((success) => {
      if (success) {
        this.currentMusic = key;
      } else {
        console.error(`Failed to play music ${key}`);
      }
    });
  }

  // Stop a sound
  stopSound(key: string): void {
    const sound = soundCache.get(key);
    if (sound && sound.isPlaying()) {
      sound.stop();
    }

    if (key === this.currentMusic) {
      this.currentMusic = null;
    }
  }

  // Pause a sound
  pauseSound(key: string): void {
    const sound = soundCache.get(key);
    if (sound && sound.isPlaying()) {
      sound.pause();
    }
  }

  // Resume a sound
  resumeSound(key: string): void {
    if (this.isMuted) return;

    const sound = soundCache.get(key);
    if (sound && !sound.isPlaying()) {
      sound.play();
    }
  }

  // Set master volume (0.0 to 1.0)
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  // Set music volume (0.0 to 1.0)
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateMusicVolumes();
  }

  // Set SFX volume (0.0 to 1.0)
  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateSfxVolumes();
  }

  // Set UI volume (0.0 to 1.0)
  setUiVolume(volume: number): void {
    this.uiVolume = Math.max(0, Math.min(1, volume));
    this.updateUiVolumes();
  }

  // Mute all audio
  mute(): void {
    this.isMuted = true;
    this.pauseAll();
  }

  // Unmute all audio
  unmute(): void {
    this.isMuted = false;
    this.resumeAll();
  }

  // Check if audio is muted
  isAudioMuted(): boolean {
    return this.isMuted;
  }

  // Get current master volume
  getMasterVolume(): number {
    return this.masterVolume;
  }

  // Get current music volume
  getMusicVolume(): number {
    return this.musicVolume;
  }

  // Get current SFX volume
  getSfxVolume(): number {
    return this.sfxVolume;
  }

  // Get current UI volume
  getUiVolume(): number {
    return this.uiVolume;
  }

  // Pause all sounds
  pauseAll(): void {
    soundCache.forEach((sound) => {
      if (sound.isPlaying()) {
        sound.pause();
      }
    });
  }

  // Resume all sounds
  resumeAll(): void {
    if (this.isMuted) return;

    soundCache.forEach((sound) => {
      if (!sound.isPlaying()) {
        sound.play();
      }
    });
  }

  // Stop all sounds
  stopAll(): void {
    soundCache.forEach((sound) => {
      if (sound.isPlaying()) {
        sound.stop();
      }
    });
    this.currentMusic = null;
  }

  // Release all sounds (free memory)
  releaseAll(): void {
    soundCache.forEach((sound) => {
      sound.release();
    });
    soundCache.clear();
    this.currentMusic = null;
  }

  // Get adjusted volume based on type and master volume
  private getAdjustedVolume(volume: number, type: AudioFileType): number {
    const typeVolume = type === 'music' ? this.musicVolume :
                      type === 'sfx' ? this.sfxVolume :
                      this.uiVolume;

    return volume * typeVolume * this.masterVolume;
  }

  // Get sound type based on key pattern
  private getSoundType(key: string): AudioFileType {
    if (key.includes('music') || key.includes('bgm')) {
      return 'music';
    } else if (key.includes('ui') || key.includes('menu')) {
      return 'ui';
    } else {
      return 'sfx';
    }
  }

  // Update volumes for all sounds
  private updateAllVolumes(): void {
    this.updateMusicVolumes();
    this.updateSfxVolumes();
    this.updateUiVolumes();
  }

  // Update music volumes
  private updateMusicVolumes(): void {
    soundCache.forEach((sound, key) => {
      if (this.getSoundType(key) === 'music') {
        const config = DEFAULT_CONFIGS.music;
        sound.setVolume(this.getAdjustedVolume(config.volume, 'music'));
      }
    });
  }

  // Update SFX volumes
  private updateSfxVolumes(): void {
    soundCache.forEach((sound, key) => {
      if (this.getSoundType(key) === 'sfx') {
        const config = DEFAULT_CONFIGS.sfx;
        sound.setVolume(this.getAdjustedVolume(config.volume, 'sfx'));
      }
    });
  }

  // Update UI volumes
  private updateUiVolumes(): void {
    soundCache.forEach((sound, key) => {
      if (this.getSoundType(key) === 'ui') {
        const config = DEFAULT_CONFIGS.ui;
        sound.setVolume(this.getAdjustedVolume(config.volume, 'ui'));
      }
    });
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();

// Game-specific audio functions
export const GameAudio = {
  // Preload all game sounds
  async preloadGameSounds(): Promise<void> {
    // This would load actual sound files
    // For now, we'll create a placeholder
    console.log('Preloading game sounds...');
  },

  // Play background music
  playBackgroundMusic(): void {
    audioManager.playMusic('bgm_space', { volume: 0.6 });
  },

  // Play player shoot sound
  playPlayerShoot(): void {
    audioManager.playSound('sfx_player_shoot', { volume: 0.7 });
  },

  // Play enemy shoot sound
  playEnemyShoot(): void {
    audioManager.playSound('sfx_enemy_shoot', { volume: 0.6 });
  },

  // Play explosion sound
  playExplosion(): void {
    audioManager.playSound('sfx_explosion', { volume: 0.8 });
  },

  // Play power-up collect sound
  playPowerUpCollect(): void {
    audioManager.playSound('sfx_powerup_collect', { volume: 0.7 });
  },

  // Play player hit sound
  playPlayerHit(): void {
    audioManager.playSound('sfx_player_hit', { volume: 0.8 });
  },

  // Play game over sound
  playGameOver(): void {
    audioManager.playSound('sfx_game_over', { volume: 0.7 });
  },

  // Play menu select sound
  playMenuSelect(): void {
    audioManager.playSound('ui_menu_select', { volume: 0.6 });
  },

  // Play menu confirm sound
  playMenuConfirm(): void {
    audioManager.playSound('ui_menu_confirm', { volume: 0.6 });
  },

  // Stop all game sounds
  stopAllGameSounds(): void {
    audioManager.stopAll();
  },

  // Set game audio volumes
  setGameVolumes(music: number, sfx: number, ui: number): void {
    audioManager.setMusicVolume(music);
    audioManager.setSfxVolume(sfx);
    audioManager.setUiVolume(ui);
  },
};