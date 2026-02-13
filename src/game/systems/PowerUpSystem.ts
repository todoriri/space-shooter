// Power-up System for Entity-Component-System architecture
// Handles power-up effects, duration tracking, and expiration

import { GameEntity, EntityType, PowerUpType, ActivePowerUp } from '../../types';

// System function that processes power-up effects and durations
export const PowerUpSystem = (
  entities: Record<string, GameEntity>,
  { time, dispatch }: { time: { current: number }; dispatch: (event: any) => void }
) => {
  const currentTime = time.current;

  // Update power-up durations and check for expiration
  Object.keys(entities).forEach(id => {
    const entity = entities[id];

    // Handle player power-ups
    if (entity.type === EntityType.PLAYER) {
      updatePlayerPowerUps(entity, currentTime, dispatch);
    }

    // Handle power-up entity expiration
    if (entity.type === EntityType.POWER_UP) {
      updatePowerUpEntity(entity, currentTime);
    }
  });

  return entities;
};

// Update player's active power-ups
const updatePlayerPowerUps = (
  playerEntity: GameEntity,
  currentTime: number,
  dispatch: (event: any) => void
) => {
  const playerComp = playerEntity.components.player;
  if (!playerComp) return;

  // Check if player has active power-ups
  if (!playerComp.activePowerUps || playerComp.activePowerUps.length === 0) {
    return;
  }

  // Filter out expired power-ups
  const activePowerUps = playerComp.activePowerUps.filter(
    (powerUp: ActivePowerUp) => powerUp.endTime > currentTime
  );

  // Apply effects for power-ups that haven't been applied yet
  activePowerUps.forEach((powerUp: ActivePowerUp) => {
    if (!powerUp.effectApplied) {
      applyPowerUpEffect(playerEntity, powerUp.type);
      powerUp.effectApplied = true;

      // Dispatch power-up activated event
      dispatch({
        type: 'powerUpActivated',
        data: {
          powerUpType: powerUp.type,
          duration: powerUp.endTime - currentTime,
        },
      });
    }
  });

  // Check for expired power-ups
  const expiredPowerUps = playerComp.activePowerUps.filter(
    (powerUp: ActivePowerUp) => powerUp.endTime <= currentTime
  );

  // Remove expired power-ups and revert their effects
  expiredPowerUps.forEach((powerUp: ActivePowerUp) => {
    removePowerUpEffect(playerEntity, powerUp.type);

    // Dispatch power-up expired event
    dispatch({
      type: 'powerUpExpired',
      data: {
        powerUpType: powerUp.type,
      },
    });
  });

  // Update player's active power-ups
  playerComp.activePowerUps = activePowerUps;

  // If no more active power-ups, reset player to default state
  if (activePowerUps.length === 0) {
    resetPlayerToDefault(playerEntity);
  }
};

// Update power-up entity (floating animation, expiration)
const updatePowerUpEntity = (powerUpEntity: GameEntity, currentTime: number) => {
  const powerUpComp = powerUpEntity.components.powerUp;
  if (!powerUpComp) return;

  // Check if power-up has expired
  if (powerUpComp.duration > 0 && powerUpComp.collectedTime) {
    const timeSinceCollection = currentTime - powerUpComp.collectedTime;
    if (timeSinceCollection > powerUpComp.duration) {
      powerUpEntity.active = false;
    }
  }
};

// Apply power-up effect to player
const applyPowerUpEffect = (playerEntity: GameEntity, powerUpType: PowerUpType) => {
  const playerComp = playerEntity.components.player;
  const health = playerEntity.components.health;

  if (!playerComp) return;

  switch (powerUpType) {
    case PowerUpType.SHIELD:
      // Shield effect - player becomes invulnerable
      if (health) {
        health.invulnerable = true;
        health.invulnerableTimer = Date.now() + 10000; // 10 seconds
      }
      break;

    case PowerUpType.RAPID_FIRE:
      // Rapid fire - reduce shoot cooldown
      playerComp.shootCooldown = 0.1; // Reduced from default 0.2 seconds
      break;

    case PowerUpType.MULTI_SHOT:
      // Multi-shot - player can shoot multiple bullets
      // This is handled in the shooting system
      break;

    case PowerUpType.BOMB:
      // Bomb - screen-clearing weapon
      // This is handled separately when player activates bomb
      break;

    case PowerUpType.HEALTH:
      // Health - restore player health
      if (health) {
        health.current = Math.min(health.max, health.current + 30);
      }
      break;

    case PowerUpType.SCORE:
      // Score - add bonus points
      playerComp.score += 500;
      break;
  }
};

// Remove power-up effect from player
const removePowerUpEffect = (playerEntity: GameEntity, powerUpType: PowerUpType) => {
  const playerComp = playerEntity.components.player;
  const health = playerEntity.components.health;

  if (!playerComp) return;

  switch (powerUpType) {
    case PowerUpType.SHIELD:
      // Remove shield invulnerability
      if (health) {
        health.invulnerable = false;
        health.invulnerableTimer = 0;
      }
      break;

    case PowerUpType.RAPID_FIRE:
      // Restore default shoot cooldown
      playerComp.shootCooldown = 0.2; // Default cooldown
      break;

    case PowerUpType.MULTI_SHOT:
      // Remove multi-shot capability
      // This is handled in the shooting system
      break;

    case PowerUpType.BOMB:
      // Bomb is one-time use, no effect to remove
      break;

    case PowerUpType.HEALTH:
      // Health is instant, no effect to remove
      break;

    case PowerUpType.SCORE:
      // Score is instant, no effect to remove
      break;
  }
};

// Reset player to default state (when all power-ups expire)
const resetPlayerToDefault = (playerEntity: GameEntity) => {
  const playerComp = playerEntity.components.player;
  const health = playerEntity.components.health;

  if (!playerComp) return;

  // Reset shoot cooldown to default
  playerComp.shootCooldown = 0.2;

  // Remove shield if present
  if (health) {
    health.invulnerable = false;
    health.invulnerableTimer = 0;
  }
};

// Helper to check if player has specific power-up
export const hasPowerUp = (playerEntity: GameEntity, powerUpType: PowerUpType): boolean => {
  const playerComp = playerEntity.components.player;
  if (!playerComp || !playerComp.activePowerUps) return false;

  return playerComp.activePowerUps.some(
    (powerUp: ActivePowerUp) => powerUp.type === powerUpType && powerUp.endTime > Date.now()
  );
};

// Helper to get remaining duration of power-up
export const getPowerUpRemainingDuration = (
  playerEntity: GameEntity,
  powerUpType: PowerUpType
): number => {
  const playerComp = playerEntity.components.player;
  if (!playerComp || !playerComp.activePowerUps) return 0;

  const powerUp = playerComp.activePowerUps.find(
    (p: ActivePowerUp) => p.type === powerUpType && p.endTime > Date.now()
  );

  return powerUp ? Math.max(0, powerUp.endTime - Date.now()) : 0;
};

// Helper to add power-up to player
export const addPowerUpToPlayer = (
  playerEntity: GameEntity,
  powerUpType: PowerUpType,
  duration: number = 10000
) => {
  const playerComp = playerEntity.components.player;
  if (!playerComp) return;

  if (!playerComp.activePowerUps) {
    playerComp.activePowerUps = [];
  }

  // Check if player already has this power-up
  const existingIndex = playerComp.activePowerUps.findIndex(
    (p: ActivePowerUp) => p.type === powerUpType
  );

  if (existingIndex >= 0) {
    // Update existing power-up duration
    playerComp.activePowerUps[existingIndex].endTime = Date.now() + duration;
    playerComp.activePowerUps[existingIndex].effectApplied = false;
  } else {
    // Add new power-up
    playerComp.activePowerUps.push({
      type: powerUpType,
      endTime: Date.now() + duration,
      effectApplied: false,
    });
  }
};