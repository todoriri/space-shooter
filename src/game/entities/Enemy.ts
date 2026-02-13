import { GameEntity, Position, Velocity, Health, EnemyComponent, EntityType, EnemyType } from '../../types';

/**
 * Creates a basic enemy entity
 * @param position - Starting position of the enemy
 * @param enemyType - Type of enemy to create
 * @returns A complete enemy entity
 */
export const createEnemyEntity = (
  position: Position,
  enemyType: EnemyType = EnemyType.BASIC
): GameEntity => {
  const enemyId = `enemy_${enemyType}_${Date.now()}`;

  // Base enemy configuration
  const baseConfig = {
    id: enemyId,
    type: EntityType.ENEMY,
    active: true,
    tags: ['enemy', 'destructible'],
  };

  // Enemy type specific configurations
  const enemyConfigs = {
    [EnemyType.BASIC]: {
      components: {
        position: {
          ...position,
          width: 30,
          height: 30,
          rotation: 180, // Facing downward
        },
        velocity: {
          x: 0,
          y: 80,
          maxSpeed: 100,
          acceleration: 200,
          friction: 100,
        },
        health: {
          current: 30,
          max: 30,
          invulnerable: false,
          invulnerableTimer: 0,
        },
        enemy: {
          type: EnemyType.BASIC,
          scoreValue: 100,
          behavior: 'straight',
          fireRate: 0, // Doesn't shoot
          lastShotTime: 0,
          movePattern: 'straight_down',
          patternTimer: 0,
          diveChance: 0.1,
        },
        collider: {
          type: 'circle' as const,
          radius: 15,
          isTrigger: false,
          layer: 'enemy',
          mask: ['player', 'player_bullet'],
        },
        renderable: {
          visible: true,
          zIndex: 5,
          sprite: 'enemy_basic',
          color: '#FF6B6B',
          alpha: 1,
        },
      },
    },
    [EnemyType.DIVING]: {
      components: {
        position: {
          ...position,
          width: 35,
          height: 35,
          rotation: 180,
        },
        velocity: {
          x: 0,
          y: 100,
          maxSpeed: 150,
          acceleration: 300,
          friction: 150,
        },
        health: {
          current: 50,
          max: 50,
          invulnerable: false,
          invulnerableTimer: 0,
        },
        enemy: {
          type: EnemyType.DIVING,
          scoreValue: 200,
          behavior: 'diving',
          fireRate: 0,
          lastShotTime: 0,
          movePattern: 'dive',
          patternTimer: 0,
          diveChance: 0.3,
          diveDirection: Math.random() > 0.5 ? 1 : -1,
        },
        collider: {
          type: 'circle' as const,
          radius: 17,
          isTrigger: false,
          layer: 'enemy',
          mask: ['player', 'player_bullet'],
        },
        renderable: {
          visible: true,
          zIndex: 5,
          sprite: 'enemy_diving',
          color: '#FFA726',
          alpha: 1,
        },
      },
    },
    [EnemyType.SHOOTING]: {
      components: {
        position: {
          ...position,
          width: 32,
          height: 32,
          rotation: 180,
        },
        velocity: {
          x: 0,
          y: 60,
          maxSpeed: 80,
          acceleration: 150,
          friction: 80,
        },
        health: {
          current: 40,
          max: 40,
          invulnerable: false,
          invulnerableTimer: 0,
        },
        enemy: {
          type: EnemyType.SHOOTING,
          scoreValue: 150,
          behavior: 'shooting',
          fireRate: 1.5, // Shots per second
          lastShotTime: 0,
          movePattern: 'zigzag',
          patternTimer: 0,
          diveChance: 0.05,
          zigzagAmplitude: 50,
          zigzagFrequency: 2,
        },
        collider: {
          type: 'circle' as const,
          radius: 16,
          isTrigger: false,
          layer: 'enemy',
          mask: ['player', 'player_bullet'],
        },
        renderable: {
          visible: true,
          zIndex: 5,
          sprite: 'enemy_shooting',
          color: '#66BB6A',
          alpha: 1,
        },
      },
    },
    [EnemyType.BOSS]: {
      components: {
        position: {
          ...position,
          width: 80,
          height: 80,
          rotation: 180,
        },
        velocity: {
          x: 0,
          y: 20,
          maxSpeed: 50,
          acceleration: 100,
          friction: 50,
        },
        health: {
          current: 500,
          max: 500,
          invulnerable: false,
          invulnerableTimer: 0,
        },
        enemy: {
          type: EnemyType.BOSS,
          scoreValue: 1000,
          behavior: 'boss',
          fireRate: 0.8,
          lastShotTime: 0,
          movePattern: 'boss_pattern',
          patternTimer: 0,
          diveChance: 0,
          phase: 1,
          attackPattern: 'spiral',
          patternCooldown: 3,
        },
        collider: {
          type: 'circle' as const,
          radius: 40,
          isTrigger: false,
          layer: 'enemy',
          mask: ['player', 'player_bullet'],
        },
        renderable: {
          visible: true,
          zIndex: 5,
          sprite: 'enemy_boss',
          color: '#AB47BC',
          alpha: 1,
        },
      },
    },
  };

  const config = enemyConfigs[enemyType];

  return {
    ...baseConfig,
    components: config.components,
  };
};

/**
 * Updates enemy movement based on behavior type
 * @param enemy - Enemy entity to update
 * @param deltaTime - Time since last update in seconds
 * @param screenWidth - Width of the game screen
 * @returns Updated enemy entity
 */
export const updateEnemyMovement = (
  enemy: GameEntity,
  deltaTime: number,
  screenWidth: number
): GameEntity => {
  if (!enemy.components.enemy || !enemy.components.position || !enemy.components.velocity) {
    return enemy;
  }

  const enemyComp = enemy.components.enemy;
  const position = enemy.components.position;
  const velocity = enemy.components.velocity;
  let newVelocity = { ...velocity };
  let newPosition = { ...position };

  switch (enemyComp.movePattern) {
    case 'straight_down':
      // Basic straight down movement
      newVelocity.x = 0;
      newVelocity.y = 80;
      break;

    case 'zigzag': {
      // Zigzag movement for shooting enemies
      enemyComp.patternTimer += deltaTime;
      const amplitude = enemyComp.zigzagAmplitude || 50;
      const frequency = enemyComp.zigzagFrequency || 2;

      newVelocity.x = Math.sin(enemyComp.patternTimer * frequency) * amplitude;
      newVelocity.y = 60;
      break;
    }

    case 'dive': {
      // Diving movement for diving enemies
      enemyComp.patternTimer += deltaTime;

      if (enemyComp.patternTimer < 1.0) {
        // Initial straight down
        newVelocity.x = 0;
        newVelocity.y = 100;
      } else if (enemyComp.patternTimer < 3.0) {
        // Dive phase
        const diveDirection = enemyComp.diveDirection || 1;
        newVelocity.x = 150 * diveDirection;
        newVelocity.y = 50;
      } else {
        // Return to straight down
        newVelocity.x = 0;
        newVelocity.y = 100;

        // Reset timer for next dive
        if (enemyComp.patternTimer > 5.0) {
          enemyComp.patternTimer = 0;
        }
      }
      break;
    }

    case 'boss_pattern': {
      // Boss movement pattern
      enemyComp.patternTimer += deltaTime;

      // Boss moves side to side slowly
      const amplitude = screenWidth / 3;
      const frequency = 0.5;

      newVelocity.x = Math.cos(enemyComp.patternTimer * frequency) * amplitude * 0.5;
      newVelocity.y = 20;

      // Boss stays within screen bounds
      const targetX = screenWidth / 2 + Math.cos(enemyComp.patternTimer * frequency) * amplitude;
      newPosition.x = targetX;
      break;
    }

    default:
      // Default straight down movement
      newVelocity.x = 0;
      newVelocity.y = 80;
  }

  // Check for random dive chance (for basic enemies)
  if (enemyComp.type === EnemyType.BASIC && Math.random() < (enemyComp.diveChance || 0)) {
    enemyComp.movePattern = 'dive';
    enemyComp.diveDirection = Math.random() > 0.5 ? 1 : -1;
    enemyComp.patternTimer = 0;
  }

  return {
    ...enemy,
    components: {
      ...enemy.components,
      position: newPosition,
      velocity: newVelocity,
      enemy: enemyComp,
    },
  };
};

/**
 * Checks if enemy can shoot based on fire rate
 * @param enemy - Enemy entity to check
 * @param currentTime - Current game time in seconds
 * @returns True if enemy can shoot
 */
export const canEnemyShoot = (enemy: GameEntity, currentTime: number): boolean => {
  if (!enemy.components.enemy) return false;

  const enemyComp = enemy.components.enemy;

  // Only shooting and boss enemies can shoot
  if (enemyComp.type !== EnemyType.SHOOTING && enemyComp.type !== EnemyType.BOSS) {
    return false;
  }

  if (enemyComp.fireRate <= 0) return false;

  const timeSinceLastShot = currentTime - enemyComp.lastShotTime;
  return timeSinceLastShot >= 1.0 / enemyComp.fireRate;
};

/**
 * Updates enemy's last shot time
 * @param enemy - Enemy entity
 * @param currentTime - Current game time in seconds
 * @returns Updated enemy entity with new last shot time
 */
export const updateEnemyLastShotTime = (enemy: GameEntity, currentTime: number): GameEntity => {
  if (!enemy.components.enemy) return enemy;

  return {
    ...enemy,
    components: {
      ...enemy.components,
      enemy: {
        ...enemy.components.enemy,
        lastShotTime: currentTime,
      },
    },
  };
};

/**
 * Applies damage to the enemy
 * @param enemy - Enemy entity to damage
 * @param damage - Amount of damage to apply
 * @returns Updated enemy entity with damage applied
 */
export const damageEnemy = (enemy: GameEntity, damage: number): GameEntity => {
  if (!enemy.components.health) return enemy;

  const health = enemy.components.health;
  const newHealth = Math.max(0, health.current - damage);

  return {
    ...enemy,
    components: {
      ...enemy.components,
      health: {
        ...health,
        current: newHealth,
      },
    },
  };
};

/**
 * Checks if enemy is alive
 * @param enemy - Enemy entity to check
 * @returns True if enemy has health remaining
 */
export const isEnemyAlive = (enemy: GameEntity): boolean => {
  if (!enemy.components.health) return false;

  return enemy.components.health.current > 0;
};

/**
 * Gets enemy's score value
 * @param enemy - Enemy entity
 * @returns Score value for destroying this enemy
 */
export const getEnemyScoreValue = (enemy: GameEntity): number => {
  return enemy.components.enemy?.scoreValue || 0;
};

/**
 * Gets enemy type
 * @param enemy - Enemy entity
 * @returns Type of enemy
 */
export const getEnemyType = (enemy: GameEntity): EnemyType => {
  return enemy.components.enemy?.type || EnemyType.BASIC;
};

/**
 * Checks if enemy is off screen
 * @param enemy - Enemy entity to check
 * @param screenHeight - Height of the game screen
 * @returns True if enemy is off screen
 */
export const isEnemyOffScreen = (enemy: GameEntity, screenHeight: number): boolean => {
  if (!enemy.components.position) return false;

  const position = enemy.components.position;

  // Enemy is off screen if it goes below the screen or above the screen
  return position.y > screenHeight + 100 || position.y < -100;
};

/**
 * Creates a single enemy for a wave
 * @param waveNumber - Current wave number
 * @param screenWidth - Width of the game screen
 * @param difficultyMultiplier - Difficulty multiplier
 * @returns An enemy entity
 */
export const createSingleEnemyForWave = (
  waveNumber: number,
  screenWidth: number,
  difficultyMultiplier: number = 1.0
): GameEntity => {
  let enemyType: EnemyType = EnemyType.BASIC;

  if (waveNumber === 1) {
    // First wave: only basic enemies
    enemyType = EnemyType.BASIC;
  } else if (waveNumber <= 3) {
    // Early waves: mix of basic and diving enemies
    enemyType = Math.random() > 0.7 ? EnemyType.DIVING : EnemyType.BASIC;
  } else if (waveNumber <= 6) {
    // Mid waves: add shooting enemies
    const rand = Math.random();
    if (rand > 0.8) {
      enemyType = EnemyType.SHOOTING;
    } else if (rand > 0.5) {
      enemyType = EnemyType.DIVING;
    } else {
      enemyType = EnemyType.BASIC;
    }
  } else if (waveNumber % 5 === 0) {
    // Boss wave handling should be separate, but if called here, return boss
    return createEnemyEntity(
      { x: screenWidth / 2, y: -100 },
      EnemyType.BOSS
    );
  } else {
    // Late waves: more variety
    const rand = Math.random();
    if (rand > 0.9) {
      enemyType = EnemyType.SHOOTING;
    } else if (rand > 0.7) {
      enemyType = EnemyType.DIVING;
    } else if (rand > 0.4) {
      enemyType = EnemyType.BASIC;
    } else {
      enemyType = EnemyType.SHOOTING;
    }
  }

  // Randomize X position
  const margin = 30;
  const x = margin + Math.random() * (screenWidth - margin * 2);
  const y = -50; // Start above screen

  const enemy = createEnemyEntity({ x, y }, enemyType);

  // Apply difficulty multiplier
  if (enemy.components.health) {
    enemy.components.health.current *= difficultyMultiplier;
    enemy.components.health.max *= difficultyMultiplier;
  }
  if (enemy.components.enemy) {
    enemy.components.enemy.scoreValue = Math.floor(enemy.components.enemy.scoreValue * difficultyMultiplier);
  }

  return enemy;
};

/**
 * Creates a wave of enemies
 * @param waveNumber - Current wave number
 * @param screenWidth - Width of the game screen
 * @returns Array of enemy entities for the wave
 */
export const createEnemyWave = (
  waveNumber: number,
  screenWidth: number,
  difficultyMultiplier: number = 1.0
): GameEntity[] => {
  const enemies: GameEntity[] = [];
  const enemyCount = 5 + Math.floor(waveNumber * 1.5);
  const spacing = screenWidth / (enemyCount + 1);

  // Determine enemy types based on wave number
  let enemyTypes: EnemyType[] = [];

  if (waveNumber === 1) {
    // First wave: only basic enemies
    enemyTypes = Array(enemyCount).fill(EnemyType.BASIC);
  } else if (waveNumber <= 3) {
    // Early waves: mix of basic and diving enemies
    for (let i = 0; i < enemyCount; i++) {
      enemyTypes.push(Math.random() > 0.7 ? EnemyType.DIVING : EnemyType.BASIC);
    }
  } else if (waveNumber <= 6) {
    // Mid waves: add shooting enemies
    for (let i = 0; i < enemyCount; i++) {
      const rand = Math.random();
      if (rand > 0.8) {
        enemyTypes.push(EnemyType.SHOOTING);
      } else if (rand > 0.5) {
        enemyTypes.push(EnemyType.DIVING);
      } else {
        enemyTypes.push(EnemyType.BASIC);
      }
    }
  } else if (waveNumber % 5 === 0) {
    // Every 5th wave: boss wave
    const boss = createEnemyEntity(
      { x: screenWidth / 2, y: -100 },
      EnemyType.BOSS
    );

    // Apply difficulty multiplier to boss
    if (boss.components.health) {
      boss.components.health.current *= difficultyMultiplier;
      boss.components.health.max *= difficultyMultiplier;
    }
    if (boss.components.enemy) {
      boss.components.enemy.scoreValue = Math.floor(boss.components.enemy.scoreValue * difficultyMultiplier);
    }

    return [boss];
  } else {
    // Late waves: more variety
    for (let i = 0; i < enemyCount; i++) {
      const rand = Math.random();
      if (rand > 0.9) {
        enemyTypes.push(EnemyType.SHOOTING);
      } else if (rand > 0.7) {
        enemyTypes.push(EnemyType.DIVING);
      } else if (rand > 0.4) {
        enemyTypes.push(EnemyType.BASIC);
      } else {
        enemyTypes.push(EnemyType.SHOOTING);
      }
    }
  }

  // Create enemies
  for (let i = 0; i < enemyCount; i++) {
    const x = spacing * (i + 1);
    const y = -50 - (i % 3) * 40; // Staggered starting positions

    const enemy = createEnemyEntity({ x, y }, enemyTypes[i]);

    // Apply difficulty multiplier
    if (enemy.components.health) {
      enemy.components.health.current *= difficultyMultiplier;
      enemy.components.health.max *= difficultyMultiplier;
    }
    if (enemy.components.enemy) {
      enemy.components.enemy.scoreValue = Math.floor(enemy.components.enemy.scoreValue * difficultyMultiplier);
    }

    enemies.push(enemy);
  }

  return enemies;
};