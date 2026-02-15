import { GameEntity, Position, Velocity, EntityType, PowerUpType } from '../../types';

/**
 * Creates a power-up entity
 * @param position - Starting position of the power-up
 * @param powerUpType - Type of power-up to create
 * @returns A complete power-up entity
 */
export const createPowerUpEntity = (
  position: Position,
  powerUpType: PowerUpType = PowerUpType.SHIELD
): GameEntity => {
  const powerUpId = `powerup_${powerUpType}_${Date.now()}`;

  // Base power-up configuration
  const baseConfig = {
    id: powerUpId,
    type: EntityType.POWER_UP,
    active: true,
    tags: ['power_up', 'collectible'],
  };

  // Power-up type specific configurations
  const powerUpConfigs = {
    [PowerUpType.SHIELD]: {
      components: {
        position: {
          ...position,
          width: 25,
          height: 25,
          rotation: 0,
        },
        velocity: {
          x: 0,
          y: 50,
          maxSpeed: 100,
          acceleration: 0,
          friction: 0,
          floatAmplitude: 20,
          floatFrequency: 1,
        },
        powerUp: {
          type: PowerUpType.SHIELD,
          duration: 10.0, // Seconds
          value: 1,
          collected: false,
          floatTimer: Math.random() * Math.PI * 2, // Random starting phase
        },
        collider: {
          type: 'circle',
          radius: 12,
          isTrigger: true,
          layer: 'power_up',
          mask: ['player'],
        },
        renderable: {
          visible: true,
          zIndex: 7,
          sprite: 'powerup_shield',
          color: '#29B6F6',
          alpha: 1,
          glowEffect: true,
          pulseEffect: true,
          pulseSpeed: 2,
        },
      },
    },
    [PowerUpType.RAPID_FIRE]: {
      components: {
        position: {
          ...position,
          width: 25,
          height: 25,
          rotation: 0,
        },
        velocity: {
          x: 0,
          y: 50,
          maxSpeed: 100,
          acceleration: 0,
          friction: 0,
          floatAmplitude: 20,
          floatFrequency: 1,
        },
        powerUp: {
          type: PowerUpType.RAPID_FIRE,
          duration: 8.0,
          value: 0.3, // Cooldown multiplier
          collected: false,
          floatTimer: Math.random() * Math.PI * 2,
        },
        collider: {
          type: 'circle',
          radius: 12,
          isTrigger: true,
          layer: 'power_up',
          mask: ['player'],
        },
        renderable: {
          visible: true,
          zIndex: 7,
          sprite: 'powerup_rapid',
          color: '#FFEE58',
          alpha: 1,
          glowEffect: true,
          pulseEffect: true,
          pulseSpeed: 3,
        },
      },
    },
    [PowerUpType.MULTI_SHOT]: {
      components: {
        position: {
          ...position,
          width: 25,
          height: 25,
          rotation: 0,
        },
        velocity: {
          x: 0,
          y: 50,
          maxSpeed: 100,
          acceleration: 0,
          friction: 0,
          floatAmplitude: 20,
          floatFrequency: 1,
        },
        powerUp: {
          type: PowerUpType.MULTI_SHOT,
          duration: 12.0,
          value: 3, // Number of additional shots
          collected: false,
          floatTimer: Math.random() * Math.PI * 2,
        },
        collider: {
          type: 'circle',
          radius: 12,
          isTrigger: true,
          layer: 'power_up',
          mask: ['player'],
        },
        renderable: {
          visible: true,
          zIndex: 7,
          sprite: 'powerup_multi',
          color: '#66BB6A',
          alpha: 1,
          glowEffect: true,
          pulseEffect: true,
          pulseSpeed: 2.5,
        },
      },
    },
    [PowerUpType.BOMB]: {
      components: {
        position: {
          ...position,
          width: 25,
          height: 25,
          rotation: 0,
        },
        velocity: {
          x: 0,
          y: 50,
          maxSpeed: 100,
          acceleration: 0,
          friction: 0,
          floatAmplitude: 20,
          floatFrequency: 1,
        },
        powerUp: {
          type: PowerUpType.BOMB,
          duration: 0, // Instant effect
          value: 100, // Damage to all enemies
          collected: false,
          floatTimer: Math.random() * Math.PI * 2,
        },
        collider: {
          type: 'circle',
          radius: 12,
          isTrigger: true,
          layer: 'power_up',
          mask: ['player'],
        },
        renderable: {
          visible: true,
          zIndex: 7,
          sprite: 'powerup_bomb',
          color: '#EF5350',
          alpha: 1,
          glowEffect: true,
          pulseEffect: true,
          pulseSpeed: 4,
        },
      },
    },
    [PowerUpType.HEALTH]: {
      components: {
        position: {
          ...position,
          width: 25,
          height: 25,
          rotation: 0,
        },
        velocity: {
          x: 0,
          y: 50,
          maxSpeed: 100,
          acceleration: 0,
          friction: 0,
          floatAmplitude: 20,
          floatFrequency: 1,
        },
        powerUp: {
          type: PowerUpType.HEALTH,
          duration: 0, // Instant effect
          value: 30, // Health restored
          collected: false,
          floatTimer: Math.random() * Math.PI * 2,
        },
        collider: {
          type: 'circle',
          radius: 12,
          isTrigger: true,
          layer: 'power_up',
          mask: ['player'],
        },
        renderable: {
          visible: true,
          zIndex: 7,
          sprite: 'powerup_health',
          color: '#EC407A',
          alpha: 1,
          glowEffect: true,
          pulseEffect: true,
          pulseSpeed: 2,
        },
      },
    },
    [PowerUpType.SCORE]: {
      components: {
        position: {
          ...position,
          width: 25,
          height: 25,
          rotation: 0,
        },
        velocity: {
          x: 0,
          y: 50,
          maxSpeed: 100,
          acceleration: 0,
          friction: 0,
          floatAmplitude: 20,
          floatFrequency: 1,
        },
        powerUp: {
          type: PowerUpType.SCORE,
          duration: 0, // Instant effect
          value: 500, // Score points
          collected: false,
          floatTimer: Math.random() * Math.PI * 2,
        },
        collider: {
          type: 'circle',
          radius: 12,
          isTrigger: true,
          layer: 'power_up',
          mask: ['player'],
        },
        renderable: {
          visible: true,
          zIndex: 7,
          sprite: 'powerup_score',
          color: '#AB47BC',
          alpha: 1,
          glowEffect: true,
          pulseEffect: true,
          pulseSpeed: 2,
        },
      },
    },
  };

  const config = powerUpConfigs[powerUpType];

  return {
    ...baseConfig,
    components: config.components as any, // Cast to any to avoid strict checking on union types for now
  };
};

/**
 * Updates power-up floating animation
 * @param powerUp - Power-up entity to update
 * @param deltaTime - Time since last update in seconds
 * @returns Updated power-up entity with floating animation
 */
export const updatePowerUpFloat = (powerUp: GameEntity, deltaTime: number): GameEntity => {
  if (!powerUp.components.powerUp || !powerUp.components.position || !powerUp.components.velocity) {
    return powerUp;
  }

  const powerUpComp = powerUp.components.powerUp;
  const position = powerUp.components.position;
  const velocity = powerUp.components.velocity;

  // Update float timer
  const newFloatTimer = powerUpComp.floatTimer + deltaTime * (velocity.floatFrequency || 1);

  // Calculate floating offset
  const floatAmplitude = velocity.floatAmplitude || 0;
  const floatOffset = Math.sin(newFloatTimer) * floatAmplitude;

  // Update position with floating effect
  const newPosition = {
    ...position,
    y: position.y + floatOffset * deltaTime,
  };

  return {
    ...powerUp,
    components: {
      ...powerUp.components,
      position: newPosition,
      powerUp: {
        ...powerUpComp,
        floatTimer: newFloatTimer,
      },
    },
  };
};

/**
 * Marks power-up as collected
 * @param powerUp - Power-up entity
 * @returns Updated power-up entity marked as collected
 */
export const collectPowerUp = (powerUp: GameEntity): GameEntity => {
  if (!powerUp.components.powerUp) return powerUp;

  return {
    ...powerUp,
    components: {
      ...powerUp.components,
      powerUp: {
        ...powerUp.components.powerUp,
        collected: true,
      },
      renderable: {
        ...powerUp.components.renderable,
        visible: false, // Hide collected power-up
        zIndex: powerUp.components.renderable?.zIndex || 0,
        color: powerUp.components.renderable?.color || '#FFFFFF',
      },
    },
  };
};

/**
 * Checks if power-up is collected
 * @param powerUp - Power-up entity to check
 * @returns True if power-up has been collected
 */
export const isPowerUpCollected = (powerUp: GameEntity): boolean => {
  return powerUp.components.powerUp?.collected || false;
};

/**
 * Gets power-up type
 * @param powerUp - Power-up entity
 * @returns Type of power-up
 */
export const getPowerUpType = (powerUp: GameEntity): PowerUpType => {
  return powerUp.components.powerUp?.type || PowerUpType.SHIELD;
};

/**
 * Gets power-up value
 * @param powerUp - Power-up entity
 * @returns Value of the power-up (damage, duration, etc.)
 */
export const getPowerUpValue = (powerUp: GameEntity): number => {
  return powerUp.components.powerUp?.value || 0;
};

/**
 * Gets power-up duration
 * @param powerUp - Power-up entity
 * @returns Duration of the power-up effect in seconds
 */
export const getPowerUpDuration = (powerUp: GameEntity): number => {
  return powerUp.components.powerUp?.duration || 0;
};

/**
 * Checks if power-up is off screen
 * @param powerUp - Power-up entity to check
 * @param screenHeight - Height of the game screen
 * @returns True if power-up is off screen
 */
export const isPowerUpOffScreen = (powerUp: GameEntity, screenHeight: number): boolean => {
  if (!powerUp.components.position) return false;

  const position = powerUp.components.position;

  // Power-up is off screen if it goes below the screen
  return position.y > screenHeight + 50;
};

/**
 * Creates a random power-up drop
 * @param position - Position where power-up should drop
 * @param dropChance - Chance of dropping a power-up (0-1)
 * @returns Power-up entity or null if no drop
 */
export const createRandomPowerUpDrop = (
  position: Position,
  dropChance: number = 0.2
): GameEntity | null => {
  // Check if power-up should drop
  if (Math.random() > dropChance) {
    return null;
  }

  // Determine power-up type based on weighted probabilities
  const rand = Math.random();
  let powerUpType: PowerUpType;

  if (rand < 0.3) {
    // 30% chance: Shield
    powerUpType = PowerUpType.SHIELD;
  } else if (rand < 0.5) {
    // 20% chance: Rapid Fire
    powerUpType = PowerUpType.RAPID_FIRE;
  } else if (rand < 0.65) {
    // 15% chance: Multi Shot
    powerUpType = PowerUpType.MULTI_SHOT;
  } else if (rand < 0.75) {
    // 10% chance: Bomb
    powerUpType = PowerUpType.BOMB;
  } else if (rand < 0.9) {
    // 15% chance: Health
    powerUpType = PowerUpType.HEALTH;
  } else {
    // 10% chance: Score
    powerUpType = PowerUpType.SCORE;
  }

  return createPowerUpEntity(position, powerUpType);
};

/**
 * Creates a guaranteed power-up drop (for boss defeats)
 * @param position - Position where power-up should drop
 * @param powerUpType - Specific power-up type to drop (optional)
 * @returns Power-up entity
 */
export const createGuaranteedPowerUpDrop = (
  position: Position,
  powerUpType?: PowerUpType
): GameEntity => {
  // If no specific type provided, choose a high-value power-up
  const type = powerUpType || (
    Math.random() > 0.5 ? PowerUpType.BOMB : PowerUpType.MULTI_SHOT
  );

  return createPowerUpEntity(position, type);
};

/**
 * Applies power-up effect to player
 * @param player - Player entity
 * @param powerUp - Power-up entity
 * @returns Updated player entity with power-up effect applied
 */
export const applyPowerUpToPlayer = (player: GameEntity, powerUp: GameEntity): GameEntity => {
  if (!player.components.player || !powerUp.components.powerUp) {
    return player;
  }

  const playerComp = player.components.player;
  const powerUpComp = powerUp.components.powerUp;
  const powerUpType = powerUpComp.type;

  let updatedPlayer = { ...playerComp };

  switch (powerUpType) {
    case PowerUpType.SHIELD:
      // Shield adds temporary invulnerability
      if (player.components.health) {
        player.components.health.invulnerable = true;
        player.components.health.invulnerableTimer = powerUpComp.duration;
      }
      break;

    case PowerUpType.RAPID_FIRE:
      // Rapid fire reduces shoot cooldown
      updatedPlayer.shootCooldown *= powerUpComp.value;
      break;

    case PowerUpType.MULTI_SHOT:
      // Multi-shot adds to power-ups list
      updatedPlayer.powerUps = [...updatedPlayer.powerUps, 'multi_shot'];
      break;

    case PowerUpType.BOMB:
      // Bomb deals damage to all enemies (handled elsewhere)
      updatedPlayer.powerUps = [...updatedPlayer.powerUps, 'bomb'];
      break;

    case PowerUpType.HEALTH:
      // Health restores player health
      if (player.components.health) {
        const health = player.components.health;
        player.components.health.current = Math.min(
          health.max,
          health.current + powerUpComp.value
        );
      }
      break;

    case PowerUpType.SCORE:
      // Score adds points
      updatedPlayer.score += powerUpComp.value;
      break;
  }

  return {
    ...player,
    components: {
      ...player.components,
      player: updatedPlayer,
    },
  };
};

/**
 * Updates power-up duration (for timed power-ups)
 * @param player - Player entity
 * @param deltaTime - Time since last update in seconds
 * @returns Updated player entity with power-up durations reduced
 */
export const updatePowerUpDurations = (player: GameEntity, deltaTime: number): GameEntity => {
  if (!player.components.player || !player.components.health) {
    return player;
  }

  const playerComp = player.components.player;
  let updatedHealth = player.components.health;

  // Update shield duration if active
  if (updatedHealth.invulnerable && (updatedHealth.invulnerableTimer ?? 0) > 0) {
    updatedHealth.invulnerableTimer = Math.max(0, (updatedHealth.invulnerableTimer ?? 0) - deltaTime);

    // If timer reaches 0, disable invulnerability
    if (updatedHealth.invulnerableTimer === 0) {
      updatedHealth.invulnerable = false;
    }
  }

  // Check for expired rapid fire
  if (playerComp.shootCooldown < 0.2) { // Default cooldown is 0.2
    // Rapid fire might have expired (this would need additional tracking)
    // For now, we'll just reset if it's too low
    playerComp.shootCooldown = 0.2;
  }

  return {
    ...player,
    components: {
      ...player.components,
      player: playerComp,
      health: updatedHealth,
    },
  };
};

/**
 * Removes expired power-ups from player
 * @param player - Player entity
 * @returns Updated player entity with expired power-ups removed
 */
export const removeExpiredPowerUps = (player: GameEntity): GameEntity => {
  if (!player.components.player) return player;

  const playerComp = player.components.player;

  // Filter out expired power-ups (this would need additional expiration tracking)
  // For now, we'll just limit the number of power-ups
  const maxPowerUps = 3;
  const trimmedPowerUps = playerComp.powerUps.slice(-maxPowerUps);

  return {
    ...player,
    components: {
      ...player.components,
      player: {
        ...playerComp,
        powerUps: trimmedPowerUps,
      },
    },
  };
};