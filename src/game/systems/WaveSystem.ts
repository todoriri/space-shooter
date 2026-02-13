// Wave System for Entity-Component-System architecture
// Handles enemy wave progression, difficulty scaling, and boss encounters

import { GameEntity, EntityType, EnemyType } from '../types';
import { createEnemyWave } from '../entities/Enemy';
import { createRandomPowerUpDrop } from '../entities/PowerUp';

// Wave configuration
export interface WaveConfig {
  waveNumber: number;
  enemyCount: number;
  enemyTypes: EnemyType[];
  spawnInterval: number;
  bossWave: boolean;
  bossType?: EnemyType;
  powerUpChance: number;
  difficultyMultiplier: number;
}

// Wave state
export interface WaveState {
  currentWave: number;
  enemiesRemaining: number;
  isBossWave: boolean;
  bossSpawned: boolean;
  bossDefeated: boolean;
  lastSpawnTime: number;
  spawnTimer: number;
  waveStartTime: number;
  waveComplete: boolean;
}

// Default wave configurations
const WAVE_CONFIGS: Record<number, WaveConfig> = {
  1: {
    waveNumber: 1,
    enemyCount: 5,
    enemyTypes: [EnemyType.BASIC],
    spawnInterval: 2000,
    bossWave: false,
    powerUpChance: 0.1,
    difficultyMultiplier: 1.0,
  },
  2: {
    waveNumber: 2,
    enemyCount: 8,
    enemyTypes: [EnemyType.BASIC, EnemyType.DIVING],
    spawnInterval: 1800,
    bossWave: false,
    powerUpChance: 0.15,
    difficultyMultiplier: 1.2,
  },
  3: {
    waveNumber: 3,
    enemyCount: 12,
    enemyTypes: [EnemyType.BASIC, EnemyType.DIVING, EnemyType.SHOOTING],
    spawnInterval: 1600,
    bossWave: false,
    powerUpChance: 0.2,
    difficultyMultiplier: 1.4,
  },
  4: {
    waveNumber: 4,
    enemyCount: 15,
    enemyTypes: [EnemyType.BASIC, EnemyType.DIVING, EnemyType.SHOOTING],
    spawnInterval: 1400,
    bossWave: false,
    powerUpChance: 0.25,
    difficultyMultiplier: 1.6,
  },
  5: {
    waveNumber: 5,
    enemyCount: 1,
    enemyTypes: [EnemyType.BOSS],
    spawnInterval: 0,
    bossWave: true,
    bossType: EnemyType.BOSS,
    powerUpChance: 0.5,
    difficultyMultiplier: 2.0,
  },
};

// System function that manages wave progression
export const WaveSystem = (
  entities: Record<string, GameEntity>,
  { time, dispatch }: { time: { current: number }; dispatch: (event: any) => void }
) => {
  const waveState = getWaveState(entities);
  const currentWaveConfig = getWaveConfig(waveState.currentWave);

  // Check if wave is complete
  if (waveState.enemiesRemaining <= 0 && !waveState.waveComplete) {
    completeWave(waveState, dispatch);
    return entities;
  }

  // Handle boss wave
  if (currentWaveConfig.bossWave && !waveState.bossSpawned) {
    spawnBossWave(entities, waveState, currentWaveConfig, dispatch);
    return entities;
  }

  // Handle regular wave spawning
  if (!waveState.waveComplete && waveState.enemiesRemaining > 0) {
    handleWaveSpawning(entities, waveState, currentWaveConfig, time.current, dispatch);
  }

  return entities;
};

// Get current wave state
const getWaveState = (entities: Record<string, GameEntity>): WaveState => {
  // Count active enemies
  let enemiesRemaining = 0;
  let bossSpawned = false;
  let bossDefeated = false;

  Object.values(entities).forEach(entity => {
    if (entity.type === EntityType.ENEMY && entity.active) {
      enemiesRemaining++;
      if (entity.components.enemy?.type === EnemyType.BOSS) {
        bossSpawned = true;
      }
    } else if (entity.type === EntityType.ENEMY && !entity.active && entity.components.enemy?.type === EnemyType.BOSS) {
      bossDefeated = true;
    }
  });

  // This would normally come from game state
  // For now, we'll use a default
  const currentWave = 1;
  const isBossWave = currentWave % 5 === 0; // Boss every 5 waves

  return {
    currentWave,
    enemiesRemaining,
    isBossWave,
    bossSpawned,
    bossDefeated,
    lastSpawnTime: 0,
    spawnTimer: 0,
    waveStartTime: Date.now(),
    waveComplete: false,
  };
};

// Get wave configuration
const getWaveConfig = (waveNumber: number): WaveConfig => {
  // Use predefined config or generate dynamic config
  if (WAVE_CONFIGS[waveNumber]) {
    return WAVE_CONFIGS[waveNumber];
  }

  // Generate dynamic wave config for waves beyond predefined
  const baseWave = waveNumber % 5 || 5;
  const baseConfig = WAVE_CONFIGS[baseWave];
  const waveMultiplier = Math.floor(waveNumber / 5) + 1;

  return {
    waveNumber,
    enemyCount: baseConfig.enemyCount * waveMultiplier,
    enemyTypes: baseConfig.enemyTypes,
    spawnInterval: Math.max(500, baseConfig.spawnInterval / waveMultiplier),
    bossWave: waveNumber % 5 === 0,
    bossType: EnemyType.BOSS,
    powerUpChance: Math.min(0.5, baseConfig.powerUpChance * waveMultiplier),
    difficultyMultiplier: baseConfig.difficultyMultiplier * waveMultiplier,
  };
};

// Handle wave spawning
const handleWaveSpawning = (
  entities: Record<string, GameEntity>,
  waveState: WaveState,
  waveConfig: WaveConfig,
  currentTime: number,
  dispatch: (event: any) => void
) => {
  // Initialize last spawn time if not set
  if (waveState.lastSpawnTime === 0) {
    waveState.lastSpawnTime = currentTime;
    return;
  }

  // Check if it's time to spawn next enemy
  const timeSinceLastSpawn = currentTime - waveState.lastSpawnTime;
  if (timeSinceLastSpawn >= waveConfig.spawnInterval) {
    // Spawn enemy
    const enemy = spawnEnemy(waveConfig, entities, dispatch);
    if (enemy) {
      entities[enemy.id] = enemy;
      waveState.enemiesRemaining--;
      waveState.lastSpawnTime = currentTime;

      // Dispatch spawn event
      dispatch({
        type: 'enemySpawn',
        data: {
          enemyType: enemy.components.enemy?.type,
          waveNumber: waveConfig.waveNumber,
        },
      });
    }
  }
};

// Spawn an enemy
const spawnEnemy = (
  waveConfig: WaveConfig,
  entities: Record<string, GameEntity>,
  dispatch: (event: any) => void
): GameEntity | null => {
  // Get screen width from entities or use default
  const screenWidth = 400; // Default, would come from game state

  // Create enemy wave (single enemy)
  const enemies = createEnemyWave(waveConfig.waveNumber, screenWidth, waveConfig.difficultyMultiplier);
  if (enemies.length === 0) return null;

  const enemy = enemies[0];

  // Apply difficulty multiplier to health
  if (enemy.components.health) {
    enemy.components.health.current *= waveConfig.difficultyMultiplier;
    enemy.components.health.max *= waveConfig.difficultyMultiplier;
  }

  // Apply difficulty multiplier to score value
  if (enemy.components.enemy) {
    enemy.components.enemy.scoreValue = Math.floor(
      enemy.components.enemy.scoreValue * waveConfig.difficultyMultiplier
    );
  }

  return enemy;
};

// Spawn boss wave
const spawnBossWave = (
  entities: Record<string, GameEntity>,
  waveState: WaveState,
  waveConfig: WaveConfig,
  dispatch: (event: any) => void
) => {
  // Spawn boss
  const screenWidth = 400; // Default
  const bossWave = createEnemyWave(waveConfig.waveNumber, screenWidth, waveConfig.difficultyMultiplier);

  if (bossWave.length > 0) {
    const boss = bossWave[0];
    entities[boss.id] = boss;
    waveState.bossSpawned = true;
    waveState.enemiesRemaining = 1;

    // Dispatch boss spawn event
    dispatch({
      type: 'bossSpawn',
      data: {
        waveNumber: waveConfig.waveNumber,
        bossType: waveConfig.bossType,
      },
    });
  }
};

// Complete current wave
const completeWave = (waveState: WaveState, dispatch: (event: any) => void) => {
  waveState.waveComplete = true;

  // Dispatch wave complete event
  dispatch({
    type: 'waveComplete',
    data: {
      waveNumber: waveState.currentWave,
      isBossWave: waveState.isBossWave,
      bossDefeated: waveState.bossDefeated,
    },
  });

  // If boss was defeated, dispatch special event
  if (waveState.isBossWave && waveState.bossDefeated) {
    dispatch({
      type: 'bossDefeated',
      data: {
        waveNumber: waveState.currentWave,
      },
    });
  }
};

// Start next wave
export const startNextWave = (
  currentWave: number,
  entities: Record<string, GameEntity>,
  dispatch: (event: any) => void
): Record<string, GameEntity> => {
  const nextWave = currentWave + 1;
  const waveConfig = getWaveConfig(nextWave);

  // Clear existing enemies (except player)
  const newEntities: Record<string, GameEntity> = {};
  Object.entries(entities).forEach(([id, entity]) => {
    if (entity.type === EntityType.PLAYER) {
      newEntities[id] = entity;
    }
  });

  // Initialize wave state
  const waveState: WaveState = {
    currentWave: nextWave,
    enemiesRemaining: waveConfig.enemyCount,
    isBossWave: waveConfig.bossWave,
    bossSpawned: false,
    bossDefeated: false,
    lastSpawnTime: 0,
    spawnTimer: 0,
    waveStartTime: Date.now(),
    waveComplete: false,
  };

  // Dispatch wave start event
  dispatch({
    type: 'waveStart',
    data: {
      waveNumber: nextWave,
      isBossWave: waveConfig.bossWave,
      enemyCount: waveConfig.enemyCount,
    },
  });

  return newEntities;
};

// Check if wave is in progress
export const isWaveInProgress = (entities: Record<string, GameEntity>): boolean => {
  const waveState = getWaveState(entities);
  return !waveState.waveComplete && waveState.enemiesRemaining > 0;
};

// Get current wave progress
export const getWaveProgress = (entities: Record<string, GameEntity>): {
  currentWave: number;
  enemiesRemaining: number;
  totalEnemies: number;
  isBossWave: boolean;
  bossHealth?: number;
  bossMaxHealth?: number;
} => {
  const waveState = getWaveState(entities);
  const waveConfig = getWaveConfig(waveState.currentWave);

  let bossHealth: number | undefined;
  let bossMaxHealth: number | undefined;

  // Find boss health if in boss wave
  if (waveState.isBossWave && waveState.bossSpawned) {
    Object.values(entities).forEach(entity => {
      if (entity.type === EntityType.ENEMY && entity.active && entity.components.enemy?.type === EnemyType.BOSS) {
        bossHealth = entity.components.health?.current;
        bossMaxHealth = entity.components.health?.max;
      }
    });
  }

  return {
    currentWave: waveState.currentWave,
    enemiesRemaining: waveState.enemiesRemaining,
    totalEnemies: waveConfig.enemyCount,
    isBossWave: waveState.isBossWave,
    bossHealth,
    bossMaxHealth,
  };
};

// Spawn power-up drop from destroyed enemy
export const spawnPowerUpDrop = (
  position: { x: number; y: number },
  chance: number,
  entities: Record<string, GameEntity>,
  dispatch: (event: any) => void
): Record<string, GameEntity> => {
  const updatedEntities = { ...entities };

  // Check if power-up should drop
  if (Math.random() < chance) {
    const powerUp = createRandomPowerUpDrop(position);
    updatedEntities[powerUp.id] = powerUp;

    // Dispatch power-up drop event
    dispatch({
      type: 'powerUpDrop',
      data: {
        position,
        powerUpType: powerUp.components.powerUp?.type,
      },
    });
  }

  return updatedEntities;
};