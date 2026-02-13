// Placeholder Assets System
// Provides fallback assets when real assets are missing during development

import { Asset } from 'expo-asset';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Placeholder asset definitions
export interface PlaceholderAsset {
  key: string;
  type: 'image' | 'sound';
  width?: number;
  height?: number;
  color?: string;
  shape?: 'circle' | 'square' | 'triangle' | 'diamond';
  text?: string;
}

// Default placeholder assets for game entities
export const PLACEHOLDER_ASSETS: PlaceholderAsset[] = [
  // Player ship
  {
    key: 'player_ship',
    type: 'image',
    width: 40,
    height: 40,
    color: '#4A90E2',
    shape: 'triangle',
    text: 'P',
  },

  // Enemy ships
  {
    key: 'enemy_basic',
    type: 'image',
    width: 30,
    height: 30,
    color: '#FF6B6B',
    shape: 'square',
    text: 'E',
  },
  {
    key: 'enemy_diving',
    type: 'image',
    width: 35,
    height: 35,
    color: '#FFA726',
    shape: 'diamond',
    text: 'D',
  },
  {
    key: 'enemy_shooting',
    type: 'image',
    width: 32,
    height: 32,
    color: '#66BB6A',
    shape: 'circle',
    text: 'S',
  },
  {
    key: 'enemy_boss',
    type: 'image',
    width: 80,
    height: 80,
    color: '#AB47BC',
    shape: 'circle',
    text: 'B',
  },

  // Bullets
  {
    key: 'bullet_player',
    type: 'image',
    width: 10,
    height: 20,
    color: '#4FC3F7',
    shape: 'circle',
  },
  {
    key: 'bullet_enemy',
    type: 'image',
    width: 10,
    height: 20,
    color: '#FF8A65',
    shape: 'circle',
  },
  {
    key: 'bullet_power',
    type: 'image',
    width: 15,
    height: 15,
    color: '#BA68C8',
    shape: 'circle',
  },

  // Power-ups
  {
    key: 'powerup_shield',
    type: 'image',
    width: 25,
    height: 25,
    color: '#29B6F6',
    shape: 'circle',
    text: 'S',
  },
  {
    key: 'powerup_rapid',
    type: 'image',
    width: 25,
    height: 25,
    color: '#FFEE58',
    shape: 'square',
    text: 'R',
  },
  {
    key: 'powerup_multi',
    type: 'image',
    width: 25,
    height: 25,
    color: '#66BB6A',
    shape: 'diamond',
    text: 'M',
  },
  {
    key: 'powerup_bomb',
    type: 'image',
    width: 25,
    height: 25,
    color: '#EF5350',
    shape: 'circle',
    text: 'B',
  },
  {
    key: 'powerup_health',
    type: 'image',
    width: 25,
    height: 25,
    color: '#EC407A',
    shape: 'square',
    text: 'H',
  },
  {
    key: 'powerup_score',
    type: 'image',
    width: 25,
    height: 25,
    color: '#AB47BC',
    shape: 'diamond',
    text: '$',
  },

  // UI elements
  {
    key: 'button_normal',
    type: 'image',
    width: 200,
    height: 60,
    color: '#4A90E2',
    shape: 'square',
    text: 'Button',
  },
  {
    key: 'button_pressed',
    type: 'image',
    width: 200,
    height: 60,
    color: '#357ABD',
    shape: 'square',
    text: 'Button',
  },

  // Background
  {
    key: 'background_stars',
    type: 'image',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    color: '#000000',
    shape: 'square',
  },
];

// Sound placeholders (empty sounds that don't error)
export const PLACEHOLDER_SOUNDS = [
  'shoot_player',
  'shoot_enemy',
  'explosion_small',
  'explosion_large',
  'powerup_collect',
  'player_hit',
  'background_music',
];

// Get a placeholder asset by key
export function getPlaceholderAsset(key: string): PlaceholderAsset | undefined {
  return PLACEHOLDER_ASSETS.find(asset => asset.key === key);
}

// Check if an asset key has a placeholder
export function hasPlaceholder(key: string): boolean {
  return PLACEHOLDER_ASSETS.some(asset => asset.key === key) ||
         PLACEHOLDER_SOUNDS.includes(key);
}

// Generate a placeholder image asset (simulated)
export function generatePlaceholderImage(placeholder: PlaceholderAsset): any {
  // In a real implementation, this would generate an actual image
  // For now, we return a mock object that has the expected properties
  return {
    width: placeholder.width || 50,
    height: placeholder.height || 50,
    uri: `placeholder://${placeholder.key}`,
    // Additional properties that might be expected
    localUri: `placeholder://${placeholder.key}`,
    __placeholder: true,
    metadata: {
      placeholder: true,
      key: placeholder.key,
      color: placeholder.color,
      shape: placeholder.shape,
      text: placeholder.text,
    },
  };
}

// Generate a placeholder sound (silent sound)
export function generatePlaceholderSound(key: string): any {
  // Return a mock sound object
  return {
    play: () => console.log(`[Placeholder] Playing sound: ${key}`),
    stop: () => console.log(`[Placeholder] Stopping sound: ${key}`),
    setVolume: (volume: number) => console.log(`[Placeholder] Setting volume for ${key}: ${volume}`),
    getDuration: () => 1.0,
    __placeholder: true,
  };
}

// Create a development asset manifest
export function createDevAssetManifest(): Record<string, any> {
  const manifest: Record<string, any> = {};

  PLACEHOLDER_ASSETS.forEach(asset => {
    manifest[asset.key] = generatePlaceholderImage(asset);
  });

  PLACEHOLDER_SOUNDS.forEach(soundKey => {
    manifest[soundKey] = generatePlaceholderSound(soundKey);
  });

  return manifest;
}

// Asset loading wrapper with placeholder fallback
export async function loadAssetWithPlaceholder(
  key: string,
  loadRealAsset: () => Promise<any>
): Promise<any> {
  try {
    // Try to load the real asset
    return await loadRealAsset();
  } catch (error) {
    console.warn(`[AssetManager] Failed to load asset "${key}", using placeholder:`, error);

    // Check if we have a placeholder
    const placeholder = getPlaceholderAsset(key);
    if (placeholder) {
      return generatePlaceholderImage(placeholder);
    }

    // Check if it's a sound placeholder
    if (PLACEHOLDER_SOUNDS.includes(key)) {
      return generatePlaceholderSound(key);
    }

    // No placeholder available, re-throw the error
    throw new Error(`No asset or placeholder found for key: ${key}`);
  }
}

// Development mode check
export const isDevelopmentMode = __DEV__;

// Development asset loading recommendations
export const DEVELOPMENT_TIPS = `
=== DEVELOPMENT MODE: ASSET PLACEHOLDERS ===

The game is running with placeholder assets. To add real assets:

1. Create the following directory structure:
   assets/
   ├── images/
   │   ├── game/
   │   │   ├── player_ship.png (40x40)
   │   │   ├── enemy_basic.png (30x30)
   │   │   ├── enemy_diving.png (35x35)
   │   │   ├── enemy_shooting.png (32x32)
   │   │   ├── enemy_boss.png (80x80)
   │   │   ├── bullet_player.png (10x20)
   │   │   ├── bullet_enemy.png (10x20)
   │   │   ├── powerup_shield.png (25x25)
   │   │   ├── powerup_rapid.png (25x25)
   │   │   ├── powerup_multi.png (25x25)
   │   │   └── powerup_bomb.png (25x25)
   │   └── ui/
   │       ├── button_normal.png (200x60)
   │       └── button_pressed.png (200x60)
   └── sounds/
       ├── shoot_player.mp3
       ├── shoot_enemy.mp3
       ├── explosion_small.mp3
       ├── explosion_large.mp3
       ├── powerup_collect.mp3
       ├── player_hit.mp3
       └── background_music.mp3

2. Recommended tools for asset creation:
   - Images: Use vector tools (Figma, Adobe Illustrator) or pixel art tools (Aseprite, Piskel)
   - Sounds: Use sound effect generators (BFXR, SFXR) or royalty-free sound libraries
   - Music: Use music creation tools (Bosca Ceoil, LMMS) or royalty-free music

3. Asset optimization tips:
   - Images: Use PNG with transparency, optimize with ImageOptim/TinyPNG
   - Sounds: Use MP3 for music (128kbps), WAV for sound effects (44.1kHz, 16-bit)
   - Memory: Unload unused assets during gameplay

Current placeholder colors:
- Player: Blue (#4A90E2)
- Enemies: Red (#FF6B6B), Orange (#FFA726), Green (#66BB6A), Purple (#AB47BC)
- Bullets: Light Blue (#4FC3F7), Light Red (#FF8A65), Purple (#BA68C8)
- Power-ups: Various colors with letters indicating type

Placeholders will be replaced automatically when real assets are added.
`;