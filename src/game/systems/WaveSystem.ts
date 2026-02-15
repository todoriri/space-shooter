// Wave System for Entity-Component-System architecture
// Handles enemy wave progression, difficulty scaling, and boss encounters

import { GameEntity, EntityType, EnemyType } from '../../types';
import { createEnemyWave, createSingleEnemyForWave, createEnemyEntity } from '../entities/Enemy';
import { createRandomPowerUpDrop } from '../entities/PowerUp';

// Initial spawn delay for warm-up (ms) - allows game loop to stabilize
const INITIAL_WARMUP_DELAY = 1500; // 1.5 seconds before first enemy spawns
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
  enemiesToSpawn: number;
  isBossWave: boolean;
  bossSpawned: boolean;
  bossDefeated: boolean;
  lastSpawnTime: number;
  spawnTimer: number;
  waveStartTime: number;
  waveComplete: boolean;
  intermissionTimer: number; // Time until next wave starts
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
  { time, dispatch }: { time: { current: number; delta?: number }; dispatch: (event: any) => void }
) => {
  const waveState = getWaveState(entities);
  const currentWaveConfig = getWaveConfig(waveState.currentWave);
  const deltaTime = time.delta || 16.67;

  // Check if wave is complete
  if (waveState.enemiesToSpawn <= 0 && waveState.enemiesRemaining <= 0 && !waveState.waveComplete) {
    completeWave(waveState, entities, dispatch);
    // Don't return here, let the intermission logic run
  }

  // Handle intermission (between waves)
  if (waveState.waveComplete) {
    waveState.intermissionTimer -= deltaTime;

    // Update entity component
    const waveManager = entities['waveManager']?.components?.waveManager;
    if (waveManager) {
      waveManager.intermissionTimer = waveState.intermissionTimer;
    }

    if (waveState.intermissionTimer <= 0) {
      startNextWaveInternal(entities, waveState, dispatch);
    }

    return entities;
  }

  // Handle boss wave
  if (currentWaveConfig.bossWave && !waveState.bossSpawned) {
    spawnBossWave(entities, waveState, currentWaveConfig, dispatch);
    return entities;
  }

  // Handle regular wave spawning
  if (!waveState.waveComplete && waveState.enemiesToSpawn > 0) {
    handleWaveSpawning(entities, waveState, currentWaveConfig, time.current, dispatch);
  }

  return entities;
};

// Get current wave state
const getWaveState = (entities: Record<string, GameEntity>): WaveState => {
  const waveManager = entities['waveManager']?.components?.waveManager;

  // Use state from entity if available
  if (waveManager) {
    // Count active enemies to ensure accuracy
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

    return {
      currentWave: waveManager.currentWave,
      enemiesRemaining,
      enemiesToSpawn: waveManager.enemiesToSpawn || 0,
      isBossWave: waveManager.isBossWave,
      bossSpawned: waveManager.bossSpawned || bossSpawned,
      bossDefeated: waveManager.bossDefeated || bossDefeated,
      lastSpawnTime: waveManager.lastSpawnTime,
      spawnTimer: waveManager.spawnTimer,
      waveStartTime: waveManager.waveStartTime,
      waveComplete: waveManager.waveComplete,
      intermissionTimer: waveManager.intermissionTimer || 0,
    };
  }

  // If waveManager is missing, create it (Self-healing)
  // console.warn('WaveManager entity missing, recreating...');

  const currentWave = 1;
  const isBossWave = false;
  const initialConfig = getWaveConfig(currentWave);

  // Create the entity
  entities['waveManager'] = {
    id: 'waveManager',
    type: EntityType.SYSTEM,
    active: true,
    tags: ['system'],
    components: {
      waveManager: {
        currentWave,
        waveComplete: false,
        enemiesRemaining: 0,
        enemiesToSpawn: initialConfig.enemyCount,
        lastSpawnTime: 0,
        isBossWave,
        bossSpawned: false,
        bossDefeated: false,
        spawnTimer: 0,
        waveStartTime: Date.now(),
        intermissionTimer: 0,
      }
    }
  };

  return {
    currentWave,
    enemiesRemaining: 0,
    enemiesToSpawn: initialConfig.enemyCount,
    isBossWave,
    bossSpawned: false,
    bossDefeated: false,
    lastSpawnTime: 0,
    spawnTimer: 0,
    waveStartTime: Date.now(),
    waveComplete: false,
    intermissionTimer: 0,
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
    // Add warm-up delay for first wave to allow game loop to stabilize
    const warmupDelay = waveState.currentWave === 1 ? INITIAL_WARMUP_DELAY : 0;
    waveState.lastSpawnTime = currentTime + warmupDelay;

    // Persist to entity component
    const waveManager = entities['waveManager']?.components?.waveManager;
    if (waveManager) {
      waveManager.lastSpawnTime = waveState.lastSpawnTime;
    }
    return;
  }

  // Check if it's time to spawn next enemy
  const timeSinceLastSpawn = currentTime - waveState.lastSpawnTime;
  if (timeSinceLastSpawn >= waveConfig.spawnInterval) {
    let newEnemies: GameEntity[] = [];

    // Chance to spawn a flock in later waves
    if (waveConfig.waveNumber > 1 && Math.random() < 0.3) {
      newEnemies = spawnFlock(waveConfig, entities, dispatch);
      if (__DEV__) console.log(`[WaveSystem] Spawning Hover Flock of ${newEnemies.length}`);
    } else {
      // Spawn single enemy
      const enemy = spawnEnemy(waveConfig, entities, dispatch);
      if (enemy) {
        newEnemies = [enemy];
      }
    }

    if (newEnemies.length > 0) {
      newEnemies.forEach(enemy => {
        entities[enemy.id] = enemy;
      });

      // Update local state for this loop pass
      waveState.enemiesToSpawn -= newEnemies.length; // Decrement enemiesToSpawn by count
      waveState.enemiesRemaining += newEnemies.length; // Increment enemiesRemaining
      waveState.lastSpawnTime = currentTime;

      // Persist to entity component
      const waveManager = entities['waveManager']?.components?.waveManager;
      if (waveManager) {
        waveManager.enemiesToSpawn = waveState.enemiesToSpawn; // Persist enemiesToSpawn
        waveManager.enemiesRemaining = waveState.enemiesRemaining; // Persist enemiesRemaining
        waveManager.lastSpawnTime = waveState.lastSpawnTime;
      }

      // Dispatch spawn event (just one generic or per enemy? generic for now)
      dispatch({
        type: 'enemySpawn',
        data: {
          enemyType: newEnemies[0].components.enemy?.type, // Representative type
          waveNumber: waveConfig.waveNumber,
          count: newEnemies.length
        },
      });
    }
  }
};

// Spawn a single enemy
const spawnEnemy = (
  waveConfig: WaveConfig,
  entities: Record<string, GameEntity>,
  dispatch: (event: any) => void
): GameEntity | null => {
  // Get screen width from entities or use default
  const screenWidth = 400; // Default, would come from game state

  // Create single enemy
  const enemy = createSingleEnemyForWave(
    waveConfig.waveNumber,
    screenWidth,
    waveConfig.difficultyMultiplier
  );

  return enemy;
};

// Spawn a flock of enemies
const spawnFlock = (
  waveConfig: WaveConfig,
  entities: Record<string, GameEntity>,
  dispatch: (event: any) => void
): GameEntity[] => {
  const screenWidth = 400; // Default
  const flockSize = 3 + Math.floor(Math.random() * 3); // 3 to 5 enemies
  const flockType = EnemyType.HOVER; // Flocks are usually hover types
  const flockEntities: GameEntity[] = [];

  // Center of flock
  const centerX = 50 + Math.random() * (screenWidth - 100);
  const startY = -50;

  for (let i = 0; i < flockSize; i++) {
    // V-Formation
    const offset = (i - Math.floor(flockSize / 2)) * 65;
    const x = centerX + offset;
    const y = startY - Math.abs(offset); // V shape

    const enemy = createEnemyEntity({ x, y }, flockType);

    // Apply difficulty
    if (enemy.components.health) {
      enemy.components.health.current *= waveConfig.difficultyMultiplier;
      enemy.components.health.max *= waveConfig.difficultyMultiplier;
    }

    // Sync phases so they move together or slightly offset
    if (enemy.components.enemy) {
      enemy.components.enemy.phase = i * 0.5;
    }

    flockEntities.push(enemy);
  }

  return flockEntities;
}

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

    // Update persistent state object - VERY IMPORTANT
    const waveManager = entities['waveManager']?.components?.waveManager;
    if (waveManager) {
      waveManager.bossSpawned = true;
      waveManager.enemiesRemaining = 1;
    }

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
const completeWave = (waveState: WaveState, entities: Record<string, GameEntity>, dispatch: (event: any) => void) => {
  // Update wave manager entity
  const waveManager = entities['waveManager']?.components?.waveManager;
  if (waveManager) {
    waveManager.waveComplete = true;
    waveManager.intermissionTimer = 3000; // 3 seconds intermission
    if (__DEV__) console.log(`Wave ${waveState.currentWave} marked as complete, starting intermission`);
  } else {
    if (__DEV__) console.error('WaveManager missing during completeWave');
  }

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

// Start next wave (Internal helper, not exported for GameEngine use anymore)
const startNextWaveInternal = (
  entities: Record<string, GameEntity>,
  lastWaveState: WaveState,
  dispatch: (event: any) => void
) => {
  const nextWave = lastWaveState.currentWave + 1;
  const waveConfig = getWaveConfig(nextWave);

  if (__DEV__) console.log(`Starting Wave ${nextWave}`);

  // We do NOT clear entities here. The GameEngine/ECS handles cleanup of dead entities.
  // We just reset the WaveManager state.

  const waveManager = entities['waveManager']?.components?.waveManager;
  if (waveManager) {
    waveManager.currentWave = nextWave;
    waveManager.waveComplete = false;
    waveManager.enemiesRemaining = 0;
    waveManager.enemiesToSpawn = waveConfig.enemyCount;
    waveManager.isBossWave = waveConfig.bossWave;
    waveManager.bossSpawned = false;
    waveManager.bossDefeated = false;
    waveManager.spawnTimer = 0;
    waveManager.waveStartTime = Date.now();
    waveManager.lastSpawnTime = 0;
    waveManager.intermissionTimer = 0;
  }

  // Spawn a guaranteed power-up at the start of the wave
  const screenWidth = 400; // Default or get from somewhere
  const powerUpX = screenWidth / 2;
  const powerUpY = 100; // Visible area

  // import createRandomPowerUpDrop is already there? Yes line 6.
  // actually createRandomPowerUpDrop creates a drop at a position.
  const powerUp = createRandomPowerUpDrop({ x: powerUpX, y: powerUpY });

  if (powerUp) {
    // Ensure it's active and has a velocity to drift down?
    // createRandomPowerUpDrop usually sets velocity.
    // Let's make sure it's added to entities.
    entities[powerUp.id] = powerUp;

    dispatch({
      type: 'powerUpDrop',
      data: {
        position: { x: powerUpX, y: powerUpY },
        powerUpType: powerUp.components.powerUp?.type,
      },
    });
  }

  // Dispatch wave start event
  dispatch({
    type: 'waveStart',
    data: {
      waveNumber: nextWave,
      isBossWave: waveConfig.bossWave,
      enemyCount: waveConfig.enemyCount,
    },
  });
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
    if (powerUp) {
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
  }

  return updatedEntities;
};