// Asset Manager for mobile game asset loading and management
// Handles images, sounds, fonts with memory-efficient caching

import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import Sound from 'react-native-sound';
import { Platform } from 'react-native';
import {
  loadAssetWithPlaceholder,
  getPlaceholderAsset,
  generatePlaceholderImage,
  generatePlaceholderSound,
  isDevelopmentMode,
  DEVELOPMENT_TIPS,
} from './PlaceholderAssets';

// Asset types
export type AssetType = 'image' | 'sound' | 'font' | 'json';

export interface AssetDefinition {
  key: string;
  type: AssetType;
  uri: string | number; // number for require(), string for URL
  preload?: boolean;
  cache?: boolean;
  soundOptions?: {
    volume?: number;
    loop?: boolean;
    category?: string;
  };
}

export interface LoadedAsset {
  key: string;
  type: AssetType;
  data: any;
  loaded: boolean;
  error?: string;
  size?: number; // Estimated size in bytes
}

// Asset categories for organized loading
export const ASSET_CATEGORIES = {
  UI: 'ui',
  GAME: 'game',
  AUDIO: 'audio',
  FONT: 'font',
} as const;

export type AssetCategory = typeof ASSET_CATEGORIES[keyof typeof ASSET_CATEGORIES];

class AssetManager {
  private static instance: AssetManager;
  private assets: Map<string, LoadedAsset> = new Map();
  private loadingPromises: Map<string, Promise<LoadedAsset>> = new Map();
  private memoryUsage: number = 0;
  private maxMemoryMB: number = 100; // Max 100MB for assets

  // Game asset definitions
  private assetDefinitions: Record<AssetCategory, AssetDefinition[]> = {
    [ASSET_CATEGORIES.UI]: [
      // UI assets
      { key: 'button_normal', type: 'image', uri: require('../../assets/images/ui/button_normal.png') },
      { key: 'button_pressed', type: 'image', uri: require('../../assets/images/ui/button_pressed.png') },
      { key: 'icon_pause', type: 'image', uri: require('../../assets/images/ui/icon_pause.png') },
      { key: 'icon_sound_on', type: 'image', uri: require('../../assets/images/ui/icon_sound_on.png') },
      { key: 'icon_sound_off', type: 'image', uri: require('../../assets/images/ui/icon_sound_off.png') },
    ],
    [ASSET_CATEGORIES.GAME]: [
      // Game sprites
      { key: 'player_ship', type: 'image', uri: require('../../assets/images/game/player_ship.png') },
      { key: 'enemy_basic', type: 'image', uri: require('../../assets/images/game/enemy_basic.png') },
      { key: 'enemy_diving', type: 'image', uri: require('../../assets/images/game/enemy_diving.png') },
      { key: 'enemy_shooting', type: 'image', uri: require('../../assets/images/game/enemy_shooting.png') },
      { key: 'enemy_boss', type: 'image', uri: require('../../assets/images/game/enemy_boss.png') },
      { key: 'bullet_player', type: 'image', uri: require('../../assets/images/game/bullet_player.png') },
      { key: 'bullet_enemy', type: 'image', uri: require('../../assets/images/game/bullet_enemy.png') },
      { key: 'powerup_shield', type: 'image', uri: require('../../assets/images/game/powerup_shield.png') },
      { key: 'powerup_rapid', type: 'image', uri: require('../../assets/images/game/powerup_rapid.png') },
      { key: 'powerup_multi', type: 'image', uri: require('../../assets/images/game/powerup_multi.png') },
      { key: 'powerup_bomb', type: 'image', uri: require('../../assets/images/game/powerup_bomb.png') },
      { key: 'background', type: 'image', uri: require('../../assets/images/game/background.png') },
      { key: 'explosion', type: 'image', uri: require('../../assets/images/game/explosion.png') },
    ],
    [ASSET_CATEGORIES.AUDIO]: [
      // Sound effects
      { key: 'shoot_player', type: 'sound', uri: require('../../assets/sounds/shoot_player.mp3'), soundOptions: { volume: 0.7 } },
      { key: 'shoot_enemy', type: 'sound', uri: require('../../assets/sounds/shoot_enemy.mp3'), soundOptions: { volume: 0.5 } },
      { key: 'explosion_small', type: 'sound', uri: require('../../assets/sounds/explosion_small.mp3'), soundOptions: { volume: 0.8 } },
      { key: 'explosion_large', type: 'sound', uri: require('../../assets/sounds/explosion_large.mp3'), soundOptions: { volume: 0.8 } },
      { key: 'powerup_collect', type: 'sound', uri: require('../../assets/sounds/powerup_collect.mp3'), soundOptions: { volume: 0.6 } },
      { key: 'player_hit', type: 'sound', uri: require('../../assets/sounds/player_hit.mp3'), soundOptions: { volume: 0.7 } },
      { key: 'game_over', type: 'sound', uri: require('../../assets/sounds/game_over.mp3'), soundOptions: { volume: 0.6 } },
      // Background music
      { key: 'bgm_menu', type: 'sound', uri: require('../../assets/sounds/bgm_menu.mp3'), soundOptions: { volume: 0.4, loop: true } },
      { key: 'bgm_game', type: 'sound', uri: require('../../assets/sounds/bgm_game.mp3'), soundOptions: { volume: 0.3, loop: true } },
    ],
    [ASSET_CATEGORIES.FONT]: [
      // Fonts
      { key: 'game_font', type: 'font', uri: require('../../assets/fonts/game_font.ttf') },
      { key: 'ui_font', type: 'font', uri: require('../../assets/fonts/ui_font.ttf') },
    ],
  };

  private constructor() {
    // Initialize sound category
    Sound.setCategory('Playback', true);

    // Enable silent mode on iOS
    if (Platform.OS === 'ios') {
      Sound.enableSilentMode(true);
    }
  }

  static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  // Load all assets for a specific category
  async loadCategory(category: AssetCategory, onProgress?: (progress: number) => void): Promise<void> {
    const definitions = this.assetDefinitions[category];
    if (!definitions || definitions.length === 0) return;

    const total = definitions.length;
    let loaded = 0;

    for (const definition of definitions) {
      try {
        await this.loadAsset(definition);
        loaded++;

        if (onProgress) {
          onProgress(loaded / total);
        }
      } catch (error) {
        console.error(`Failed to load asset ${definition.key}:`, error);
        // Continue loading other assets even if one fails
      }
    }
  }

  // Load all essential assets for game startup
  async loadEssentialAssets(): Promise<void> {
    console.log('Loading essential assets...');

    // Load fonts first (needed for UI)
    await this.loadCategory(ASSET_CATEGORIES.FONT);

    // Load UI assets
    await this.loadCategory(ASSET_CATEGORIES.UI);

    // Load game sprites (can be lazy loaded during gameplay)
    await this.loadCategory(ASSET_CATEGORIES.GAME);

    console.log('Essential assets loaded');
  }

  // Load a single asset
  async loadAsset(definition: AssetDefinition): Promise<LoadedAsset> {
    const { key, type, uri } = definition;

    // Check if already loaded or loading
    if (this.assets.has(key)) {
      return this.assets.get(key)!;
    }

    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!;
    }

    // Create loading promise
    const loadPromise = this.loadAssetInternal(definition);
    this.loadingPromises.set(key, loadPromise);

    try {
      const loadedAsset = await loadPromise;
      this.assets.set(key, loadedAsset);
      this.loadingPromises.delete(key);
      return loadedAsset;
    } catch (error) {
      this.loadingPromises.delete(key);
      throw error;
    }
  }

  private async loadAssetInternal(definition: AssetDefinition): Promise<LoadedAsset> {
    const { key, type, uri, soundOptions } = definition;

    try {
      let data: any;
      let size = 0;

      switch (type) {
        case 'image':
          // Load image asset with placeholder fallback
          data = await loadAssetWithPlaceholder(key, async () => {
            const asset = Asset.fromModule(uri as number);
            await asset.downloadAsync();

            // Log asset loading in development
            if (isDevelopmentMode) {
              console.log(`[AssetManager] Loaded image: ${key} (${asset.width}x${asset.height})`);
            }

            return asset;
          });

          // Estimate size
          if (data.__placeholder) {
            // Placeholder image
            size = (data.width || 50) * (data.height || 50) * 4;
            if (isDevelopmentMode) {
              console.log(`[AssetManager] Using placeholder for: ${key}`);
            }
          } else {
            // Real image
            size = data.width * data.height * 4;
          }
          break;

        case 'sound':
          // Load sound asset with placeholder fallback
          data = await loadAssetWithPlaceholder(key, async () => {
            return await new Promise<Sound>((resolve, reject) => {
              const sound = new Sound(uri as number, (error) => {
                if (error) {
                  reject(error);
                  return;
                }

                // Apply sound options
                if (soundOptions?.volume !== undefined) {
                  sound.setVolume(soundOptions.volume);
                }

                if (soundOptions?.loop) {
                  sound.setNumberOfLoops(-1); // Infinite loop
                }

                // Log sound loading in development
                if (isDevelopmentMode) {
                  console.log(`[AssetManager] Loaded sound: ${key}`);
                }

                resolve(sound);
              });
            });
          });

          // Estimate size
          if (data.__placeholder) {
            // Placeholder sound
            size = 10 * 1024; // 10KB estimate for placeholder
            if (isDevelopmentMode) {
              console.log(`[AssetManager] Using placeholder sound for: ${key}`);
            }
          } else {
            // Real sound
            const duration = data.getDuration();
            size = Math.floor(duration * 128 * 1024 / 8); // 128kbps estimate
          }
          break;

        case 'font':
          // Load font asset
          const fontName = key;
          await Font.loadAsync({
            [fontName]: uri as number,
          });
          data = fontName;
          size = 100 * 1024; // Estimate 100KB per font
          break;

        case 'json':
          // Load JSON data
          const response = await fetch(uri as string);
          data = await response.json();
          size = JSON.stringify(data).length;
          break;

        default:
          throw new Error(`Unsupported asset type: ${type}`);
      }

      // Update memory usage
      this.memoryUsage += size;

      // Check memory limits
      if (this.memoryUsage > this.maxMemoryMB * 1024 * 1024) {
        console.warn(`Asset memory usage high: ${Math.round(this.memoryUsage / (1024 * 1024))}MB`);
        this.cleanupOldAssets();
      }

      return {
        key,
        type,
        data,
        loaded: true,
        size,
      };
    } catch (error) {
      return {
        key,
        type,
        data: null,
        loaded: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get a loaded asset
  getAsset(key: string): LoadedAsset | null {
    return this.assets.get(key) || null;
  }

  // Check if asset is loaded
  isAssetLoaded(key: string): boolean {
    const asset = this.assets.get(key);
    return asset?.loaded || false;
  }

  // Play a sound asset
  playSound(key: string, options?: { volume?: number; loop?: boolean }): Sound | null {
    const asset = this.getAsset(key);
    if (!asset || asset.type !== 'sound' || !asset.loaded) {
      console.warn(`Sound ${key} not loaded or not a sound asset`);
      return null;
    }

    const sound: Sound = asset.data;

    try {
      // Stop if already playing
      sound.stop();

      // Apply options
      if (options?.volume !== undefined) {
        sound.setVolume(options.volume);
      }

      if (options?.loop) {
        sound.setNumberOfLoops(-1);
      }

      // Play sound
      sound.play((success) => {
        if (!success) {
          console.warn(`Failed to play sound: ${key}`);
        }
      });

      return sound;
    } catch (error) {
      console.error(`Error playing sound ${key}:`, error);
      return null;
    }
  }

  // Stop a sound
  stopSound(key: string): void {
    const asset = this.getAsset(key);
    if (asset?.type === 'sound' && asset.loaded) {
      const sound: Sound = asset.data;
      sound.stop();
    }
  }

  // Set global sound volume
  setSoundVolume(volume: number): void {
    // Update volume for all loaded sounds
    this.assets.forEach((asset) => {
      if (asset.type === 'sound' && asset.loaded) {
        const sound: Sound = asset.data;
        sound.setVolume(volume);
      }
    });
  }

  // Cleanup old/unused assets to free memory
  cleanupOldAssets(keepKeys: string[] = []): void {
    const essentialKeys = new Set(keepKeys);

    // Keep essential assets and recently used ones
    const keysToRemove: string[] = [];

    this.assets.forEach((asset, key) => {
      if (!essentialKeys.has(key) && asset.type !== 'font') {
        keysToRemove.push(key);
      }
    });

    // Remove assets (limit to free up to 50% of memory)
    const targetMemory = this.maxMemoryMB * 1024 * 1024 * 0.5;
    let freedMemory = 0;

    for (const key of keysToRemove) {
      const asset = this.assets.get(key);
      if (asset) {
        // Release resources
        if (asset.type === 'sound' && asset.loaded) {
          const sound: Sound = asset.data;
          sound.release();
        }

        // Update memory usage
        freedMemory += asset.size || 0;
        this.assets.delete(key);

        if (this.memoryUsage - freedMemory <= targetMemory) {
          break;
        }
      }
    }

    this.memoryUsage -= freedMemory;
    console.log(`Cleaned up ${Math.round(freedMemory / (1024 * 1024))}MB of assets`);
  }

  // Get memory usage in MB
  getMemoryUsageMB(): number {
    return Math.round(this.memoryUsage / (1024 * 1024));
  }

  // Get loading progress for a category
  getCategoryProgress(category: AssetCategory): number {
    const definitions = this.assetDefinitions[category];
    if (!definitions) return 0;

    const loaded = definitions.filter(def => this.isAssetLoaded(def.key)).length;
    return definitions.length > 0 ? loaded / definitions.length : 0;
  }

  // Preload assets in background
  async preloadAssets(category: AssetCategory): Promise<void> {
    const definitions = this.assetDefinitions[category];
    if (!definitions) return;

    // Load assets without blocking
    definitions.forEach(async (definition) => {
      if (!this.isAssetLoaded(definition.key) && !this.loadingPromises.has(definition.key)) {
        try {
          await this.loadAsset(definition);
        } catch (error) {
          // Silent fail for preloading
        }
      }
    });
  }

  // Clear all assets (for testing or reset)
  clearAll(): void {
    // Release all sounds
    this.assets.forEach((asset) => {
      if (asset.type === 'sound' && asset.loaded) {
        const sound: Sound = asset.data;
        sound.release();
      }
    });

    this.assets.clear();
    this.loadingPromises.clear();
    this.memoryUsage = 0;
  }

  // Log development tips
  logDevelopmentTips(): void {
    if (isDevelopmentMode) {
      console.log(DEVELOPMENT_TIPS);
    }
  }

  // Check if an asset is a placeholder
  isPlaceholderAsset(key: string): boolean {
    const asset = this.assets.get(key);
    return asset?.data?.__placeholder === true;
  }

  // Get placeholder statistics
  getPlaceholderStats(): { total: number; placeholders: number; percentage: number } {
    const total = this.assets.size;
    let placeholders = 0;

    this.assets.forEach(asset => {
      if (asset.data?.__placeholder) {
        placeholders++;
      }
    });

    return {
      total,
      placeholders,
      percentage: total > 0 ? Math.round((placeholders / total) * 100) : 0,
    };
  }
}

// Singleton instance export
export const assetManager = AssetManager.getInstance();

// Helper hook for React components
export const useAssetManager = () => {
  return assetManager;
};

// Predefined asset groups for common scenarios
export const ASSET_GROUPS = {
  MENU: [ASSET_CATEGORIES.FONT, ASSET_CATEGORIES.UI, ASSET_CATEGORIES.AUDIO] as AssetCategory[],
  GAME: [ASSET_CATEGORIES.GAME, ASSET_CATEGORIES.AUDIO] as AssetCategory[],
  ALL: Object.values(ASSET_CATEGORIES) as AssetCategory[],
};