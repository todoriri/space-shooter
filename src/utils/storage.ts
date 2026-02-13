// Storage utilities for game data persistence
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  HIGH_SCORE: '@space_shooter/high_score',
  GAME_SETTINGS: '@space_shooter/game_settings',
  PLAYER_STATS: '@space_shooter/player_stats',
  UNLOCKED_ACHIEVEMENTS: '@space_shooter/unlocked_achievements',
} as const;

// High score management
export const saveHighScore = async (score: number): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score.toString());
    return true;
  } catch (error) {
    console.error('Failed to save high score:', error);
    return false;
  }
};

export const loadHighScore = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
    return value ? parseInt(value, 10) : 0;
  } catch (error) {
    console.error('Failed to load high score:', error);
    return 0;
  }
};

export const clearHighScore = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.HIGH_SCORE);
    return true;
  } catch (error) {
    console.error('Failed to clear high score:', error);
    return false;
  }
};

// Game settings
export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  controlsSensitivity: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
  difficulty: 'medium',
  controlsSensitivity: 1.0,
};

export const saveGameSettings = async (settings: GameSettings): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.GAME_SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Failed to save game settings:', error);
    return false;
  }
};

export const loadGameSettings = async (): Promise<GameSettings> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.GAME_SETTINGS);
    return value ? JSON.parse(value) : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Failed to load game settings:', error);
    return DEFAULT_SETTINGS;
  }
};

// Player statistics
export interface PlayerStats {
  totalGamesPlayed: number;
  totalEnemiesDestroyed: number;
  totalScore: number;
  totalPlayTime: number; // in seconds
  highestWave: number;
  powerUpsCollected: number;
}

export const DEFAULT_STATS: PlayerStats = {
  totalGamesPlayed: 0,
  totalEnemiesDestroyed: 0,
  totalScore: 0,
  totalPlayTime: 0,
  highestWave: 0,
  powerUpsCollected: 0,
};

export const savePlayerStats = async (stats: PlayerStats): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYER_STATS, JSON.stringify(stats));
    return true;
  } catch (error) {
    console.error('Failed to save player stats:', error);
    return false;
  }
};

export const loadPlayerStats = async (): Promise<PlayerStats> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.PLAYER_STATS);
    return value ? JSON.parse(value) : DEFAULT_STATS;
  } catch (error) {
    console.error('Failed to load player stats:', error);
    return DEFAULT_STATS;
  }
};

export const updatePlayerStats = async (
  updates: Partial<PlayerStats>
): Promise<PlayerStats> => {
  try {
    const currentStats = await loadPlayerStats();
    const updatedStats = { ...currentStats, ...updates };
    await savePlayerStats(updatedStats);
    return updatedStats;
  } catch (error) {
    console.error('Failed to update player stats:', error);
    return DEFAULT_STATS;
  }
};

// Achievements
export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockDate?: number;
  requirement: number;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Destroy your first enemy',
    unlocked: false,
    requirement: 1,
    icon: '🎯',
  },
  {
    id: 'score_1000',
    name: 'Space Cadet',
    description: 'Reach 1000 points in a single game',
    unlocked: false,
    requirement: 1000,
    icon: '⭐',
  },
  {
    id: 'score_5000',
    name: 'Space Commander',
    description: 'Reach 5000 points in a single game',
    unlocked: false,
    requirement: 5000,
    icon: '👨‍🚀',
  },
  {
    id: 'score_10000',
    name: 'Space Admiral',
    description: 'Reach 10000 points in a single game',
    unlocked: false,
    requirement: 10000,
    icon: '🎖️',
  },
  {
    id: 'wave_5',
    name: 'Wave Warrior',
    description: 'Reach wave 5',
    unlocked: false,
    requirement: 5,
    icon: '🌊',
  },
  {
    id: 'wave_10',
    name: 'Wave Master',
    description: 'Reach wave 10',
    unlocked: false,
    requirement: 10,
    icon: '👑',
  },
  {
    id: 'enemies_100',
    name: 'Enemy Hunter',
    description: 'Destroy 100 enemies',
    unlocked: false,
    requirement: 100,
    icon: '🎯',
  },
  {
    id: 'enemies_500',
    name: 'Enemy Slayer',
    description: 'Destroy 500 enemies',
    unlocked: false,
    requirement: 500,
    icon: '⚔️',
  },
  {
    id: 'no_damage',
    name: 'Untouchable',
    description: 'Complete a wave without taking damage',
    unlocked: false,
    requirement: 1,
    icon: '🛡️',
  },
  {
    id: 'boss_killer',
    name: 'Boss Killer',
    description: 'Defeat a boss enemy',
    unlocked: false,
    requirement: 1,
    icon: '👾',
  },
];

export const loadUnlockedAchievements = async (): Promise<Set<string>> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.UNLOCKED_ACHIEVEMENTS);
    const unlockedIds = value ? JSON.parse(value) : [];
    return new Set(unlockedIds);
  } catch (error) {
    console.error('Failed to load unlocked achievements:', error);
    return new Set();
  }
};

export const saveUnlockedAchievements = async (unlockedIds: Set<string>): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.UNLOCKED_ACHIEVEMENTS,
      JSON.stringify(Array.from(unlockedIds))
    );
    return true;
  } catch (error) {
    console.error('Failed to save unlocked achievements:', error);
    return false;
  }
};

export const unlockAchievement = async (achievementId: string): Promise<boolean> => {
  try {
    const unlocked = await loadUnlockedAchievements();
    unlocked.add(achievementId);
    await saveUnlockedAchievements(unlocked);
    return true;
  } catch (error) {
    console.error('Failed to unlock achievement:', error);
    return false;
  }
};

export const checkAchievementUnlocked = async (achievementId: string): Promise<boolean> => {
  try {
    const unlocked = await loadUnlockedAchievements();
    return unlocked.has(achievementId);
  } catch (error) {
    console.error('Failed to check achievement:', error);
    return false;
  }
};

// Bulk operations
export const clearAllGameData = async (): Promise<boolean> => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
    return true;
  } catch (error) {
    console.error('Failed to clear all game data:', error);
    return false;
  }
};

export const exportGameData = async (): Promise<string> => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    const values = await AsyncStorage.multiGet(keys);
    const data: Record<string, any> = {};

    values.forEach(([key, value]) => {
      if (value !== null) {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      }
    });

    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Failed to export game data:', error);
    return '{}';
  }
};

export const importGameData = async (jsonData: string): Promise<boolean> => {
  try {
    const data = JSON.parse(jsonData);
    const entries = Object.entries(data).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    ]);

    await AsyncStorage.multiSet(entries as [string, string][]);
    return true;
  } catch (error) {
    console.error('Failed to import game data:', error);
    return false;
  }
};