import { GameEntity, Position, Velocity, Health, PlayerComponent, EntityType } from '../../types';

/**
 * Creates a player entity with initial position, velocity, and health
 * @param initialPosition - Starting position of the player
 * @returns A complete player entity
 */
export const createPlayerEntity = (initialPosition: Position = { x: 200, y: 500 }): GameEntity => {
  const playerId = `player_${Date.now()}`;

  return {
    id: playerId,
    type: EntityType.PLAYER,
    active: true,
    tags: ['player', 'controllable', 'destructible'],
    components: {
      position: {
        ...initialPosition,
        width: 40,
        height: 40,
        rotation: 0,
      },
      velocity: {
        x: 0,
        y: 0,
        maxSpeed: 300,
        acceleration: 800,
        friction: 600,
      },
      health: {
        current: 100,
        max: 100,
        invulnerable: false,
        invulnerableTimer: 0,
      },
      player: {
        canShoot: true,
        shootCooldown: 0.2, // seconds between shots
        lastShotTime: 0,
        powerUps: [],
        score: 0,
        lives: 3,
      },
      collider: {
        type: 'circle',
        radius: 20,
        isTrigger: false,
        layer: 'player',
        mask: ['enemy', 'enemy_bullet', 'power_up'],
      },
      renderable: {
        visible: true,
        zIndex: 10,
        sprite: 'player_ship',
        color: '#4A90E2',
        alpha: 1,
      },
    },
    tags: ['player', 'controllable', 'shooter'],
  };
};

/**
 * Updates player shooting cooldown
 * @param player - Player entity to update
 * @param deltaTime - Time since last update in seconds
 * @returns Updated player entity
 */
export const updatePlayerShooting = (player: GameEntity, deltaTime: number): GameEntity => {
  if (!player.components.player) return player;

  const playerComp = player.components.player;

  // Update cooldown timer
  if (playerComp.lastShotTime > 0) {
    playerComp.lastShotTime = Math.max(0, playerComp.lastShotTime - deltaTime);
  }

  return {
    ...player,
    components: {
      ...player.components,
      player: playerComp,
    },
  };
};

/**
 * Applies damage to the player
 * @param player - Player entity to damage
 * @param damage - Amount of damage to apply
 * @returns Updated player entity with damage applied
 */
export const damagePlayer = (player: GameEntity, damage: number): GameEntity => {
  if (!player.components.health || !player.components.player) return player;

  const health = player.components.health;
  const playerComp = player.components.player;

  // Check if player is invulnerable
  if (health.invulnerable) return player;

  // Apply damage
  const newHealth = Math.max(0, health.current - damage);

  // Set invulnerability after taking damage
  const updatedHealth = {
    ...health,
    current: newHealth,
    invulnerable: true,
    invulnerableTimer: 1.0, // 1 second of invulnerability
  };

  // Decrease lives if health reaches 0
  let updatedPlayer = playerComp;
  if (newHealth === 0 && playerComp.lives > 0) {
    updatedPlayer = {
      ...playerComp,
      lives: playerComp.lives - 1,
    };
  }

  return {
    ...player,
    components: {
      ...player.components,
      health: updatedHealth,
      player: updatedPlayer,
    },
  };
};

/**
 * Heals the player
 * @param player - Player entity to heal
 * @param amount - Amount of health to restore
 * @returns Updated player entity with health restored
 */
export const healPlayer = (player: GameEntity, amount: number): GameEntity => {
  if (!player.components.health) return player;

  const health = player.components.health;
  const newHealth = Math.min(health.max, health.current + amount);

  return {
    ...player,
    components: {
      ...player.components,
      health: {
        ...health,
        current: newHealth,
      },
    },
  };
};

/**
 * Adds a power-up to the player
 * @param player - Player entity
 * @param powerUpType - Type of power-up to add
 * @returns Updated player entity with power-up
 */
export const addPlayerPowerUp = (player: GameEntity, powerUpType: string): GameEntity => {
  if (!player.components.player) return player;

  const playerComp = player.components.player;
  const updatedPowerUps = [...playerComp.powerUps, powerUpType];

  // Limit power-ups to prevent infinite stacking
  const maxPowerUps = 3;
  const trimmedPowerUps = updatedPowerUps.slice(-maxPowerUps);

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

/**
 * Removes a power-up from the player
 * @param player - Player entity
 * @param powerUpType - Type of power-up to remove
 * @returns Updated player entity without the power-up
 */
export const removePlayerPowerUp = (player: GameEntity, powerUpType: string): GameEntity => {
  if (!player.components.player) return player;

  const playerComp = player.components.player;
  const updatedPowerUps = playerComp.powerUps.filter(p => p !== powerUpType);

  return {
    ...player,
    components: {
      ...player.components,
      player: {
        ...playerComp,
        powerUps: updatedPowerUps,
      },
    },
  };
};

/**
 * Checks if player can shoot based on cooldown
 * @param player - Player entity to check
 * @param currentTime - Current game time in seconds
 * @returns True if player can shoot
 */
export const canPlayerShoot = (player: GameEntity, currentTime: number): boolean => {
  if (!player.components.player) return false;

  const playerComp = player.components.player;
  return currentTime - playerComp.lastShotTime >= playerComp.shootCooldown;
};

/**
 * Updates player's last shot time
 * @param player - Player entity
 * @param currentTime - Current game time in seconds
 * @returns Updated player entity with new last shot time
 */
export const updatePlayerLastShotTime = (player: GameEntity, currentTime: number): GameEntity => {
  if (!player.components.player) return player;

  return {
    ...player,
    components: {
      ...player.components,
      player: {
        ...player.components.player,
        lastShotTime: currentTime,
      },
    },
  };
};

/**
 * Adds score to the player
 * @param player - Player entity
 * @param score - Score to add
 * @returns Updated player entity with increased score
 */
export const addPlayerScore = (player: GameEntity, score: number): GameEntity => {
  if (!player.components.player) return player;

  const playerComp = player.components.player;

  return {
    ...player,
    components: {
      ...player.components,
      player: {
        ...playerComp,
        score: playerComp.score + score,
      },
    },
  };
};

/**
 * Resets player to initial state (used after losing a life)
 * @param player - Player entity to reset
 * @param position - New position for the player
 * @returns Reset player entity
 */
export const resetPlayer = (player: GameEntity, position: Position): GameEntity => {
  if (!player.components.player || !player.components.health) return player;

  return {
    ...player,
    components: {
      ...player.components,
      position: {
        ...player.components.position,
        ...position,
      },
      velocity: {
        ...player.components.velocity,
        x: 0,
        y: 0,
      },
      health: {
        ...player.components.health,
        current: 100,
        invulnerable: true,
        invulnerableTimer: 2.0, // 2 seconds of invulnerability after respawn
      },
      player: {
        ...player.components.player,
        powerUps: [],
      },
    },
  };
};

/**
 * Checks if player is alive
 * @param player - Player entity to check
 * @returns True if player has health and lives remaining
 */
export const isPlayerAlive = (player: GameEntity): boolean => {
  if (!player.components.player || !player.components.health) return false;

  const playerComp = player.components.player;
  const health = player.components.health;

  return health.current > 0 && playerComp.lives > 0;
};

/**
 * Gets player's current score
 * @param player - Player entity
 * @returns Player's score
 */
export const getPlayerScore = (player: GameEntity): number => {
  return player.components.player?.score || 0;
};

/**
 * Gets player's remaining lives
 * @param player - Player entity
 * @returns Player's remaining lives
 */
export const getPlayerLives = (player: GameEntity): number => {
  return player.components.player?.lives || 0;
};

/**
 * Gets player's active power-ups
 * @param player - Player entity
 * @returns Array of active power-up types
 */
export const getPlayerPowerUps = (player: GameEntity): string[] => {
  return player.components.player?.powerUps || [];
};