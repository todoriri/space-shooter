// Movement System for Entity-Component-System architecture
// Handles position updates, velocity application, and screen boundaries
// Updated to work with proper ECS component structure

import { Dimensions } from 'react-native';
import { GameEntity, EntityType, EnemyType, Position, Velocity } from '../../types';
import { clamp, lerp } from '../../utils/math';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// System function that processes all entities with movement components
export const MovementSystem = (
  entities: Record<string, GameEntity>,
  { time }: { time: { delta: number; current: number } }
) => {
  const deltaTime = Math.min(time.delta, 100) / 1000; // Convert to seconds, cap at 100ms
  const currentTime = time.current;

  Object.values(entities).forEach(entity => {
    // Skip if entity is not active
    if (!entity.active) return;

    const position = entity.components.position;
    const velocity = entity.components.velocity;

    if (!position || !velocity) return;

    // Handle movement based on entity type
    switch (entity.type) {
      case EntityType.PLAYER:
        handlePlayerMovement(entity, deltaTime);
        break;

      case EntityType.ENEMY:
        handleEnemyMovement(entity, deltaTime, currentTime);
        break;

      case EntityType.BULLET:
        handleBulletMovement(entity, deltaTime);
        break;

      case EntityType.POWER_UP:
        handlePowerUpMovement(entity, deltaTime);
        break;

      default:
        // Default movement: apply velocity to position
        position.x += velocity.x * deltaTime;
        position.y += velocity.y * deltaTime;
        break;
    }

    // Apply screen boundaries
    applyScreenBoundaries(entity);
  });

  return entities;
};

// Handle player movement with touch controls
const handlePlayerMovement = (entity: GameEntity, deltaTime: number) => {
  const position = entity.components.position;
  const velocity = entity.components.velocity;
  const playerComp = entity.components.player;

  if (!position || !velocity || !playerComp) return;

  // Get touch target position
  const touchTarget = playerComp.touchPosition;
  if (!touchTarget) {
    // No touch input, apply friction
    velocity.x *= Math.pow(0.1, deltaTime);
    velocity.y *= Math.pow(0.1, deltaTime);
  } else {
    // Move toward touch target
    const dx = touchTarget.x - position.x;
    const dy = touchTarget.y - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      // Normalize direction and apply acceleration
      const dirX = dx / distance;
      const dirY = dy / distance;

      velocity.x += dirX * (velocity.acceleration || 800) * deltaTime;
      velocity.y += dirY * (velocity.acceleration || 800) * deltaTime;
    } else {
      // Close enough to target, slow down
      velocity.x *= Math.pow(0.1, deltaTime);
      velocity.y *= Math.pow(0.1, deltaTime);
    }
  }

  // Apply velocity to position
  position.x += velocity.x * deltaTime;
  position.y += velocity.y * deltaTime;

  // Apply max speed limit
  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  const maxSpeed = velocity.maxSpeed || 300;
  if (speed > maxSpeed) {
    velocity.x = (velocity.x / speed) * maxSpeed;
    velocity.y = (velocity.y / speed) * maxSpeed;
  }

  // Apply friction
  const friction = velocity.friction || 600;
  velocity.x *= Math.pow(0.1, friction * deltaTime);
  velocity.y *= Math.pow(0.1, friction * deltaTime);
};

// Handle enemy movement based on type
const handleEnemyMovement = (entity: GameEntity, deltaTime: number, currentTime: number) => {
  const position = entity.components.position;
  const velocity = entity.components.velocity;
  const enemyComp = entity.components.enemy;

  if (!position || !velocity || !enemyComp) return;

  const enemyType = enemyComp.type;

  switch (enemyType) {
    case EnemyType.BASIC:
      // Basic enemy moves straight down
      position.y += velocity.y * deltaTime;
      break;

    case EnemyType.DIVING:
      // Diving enemy moves in a sine wave pattern
      position.y += velocity.y * deltaTime;
      position.x += Math.sin(currentTime * 0.001 + (enemyComp.phase || 0)) * 100 * deltaTime;
      break;

    case EnemyType.SHOOTING:
      // Shooting enemy moves slowly with occasional zigzag
      position.y += velocity.y * deltaTime * 0.5; // Slower movement

      // Zigzag pattern
      if (enemyComp.movePattern === 'zigzag') {
        const amplitude = enemyComp.zigzagAmplitude || 50;
        const frequency = enemyComp.zigzagFrequency || 2;
        position.x += Math.sin(currentTime * 0.001 * frequency) * amplitude * deltaTime;
      }
      break;

    case EnemyType.BOSS:
      // Boss enemy moves slowly with complex patterns
      position.y += velocity.y * deltaTime * 0.3; // Very slow movement

      // Boss movement pattern
      if (enemyComp.movePattern === 'float') {
        const floatAmplitude = velocity.floatAmplitude || 20;
        const floatFrequency = velocity.floatFrequency || 1;
        position.x += Math.sin(currentTime * 0.001 * floatFrequency) * floatAmplitude * deltaTime;
        position.y += Math.cos(currentTime * 0.001 * floatFrequency * 0.5) * floatAmplitude * 0.5 * deltaTime;
      }
      break;
  }
};

// Handle bullet movement
const handleBulletMovement = (entity: GameEntity, deltaTime: number) => {
  const position = entity.components.position;
  const velocity = entity.components.velocity;
  const bulletComp = entity.components.bullet;

  if (!position || !velocity) return;

  // Apply velocity to position
  position.x += velocity.x * deltaTime;
  position.y += velocity.y * deltaTime;

  // Update bullet age
  if (bulletComp) {
    bulletComp.age += deltaTime;

    // Check if bullet has expired
    if (bulletComp.age > bulletComp.lifetime) {
      entity.active = false;
    }
  }
};

// Handle power-up movement (floating animation)
const handlePowerUpMovement = (entity: GameEntity, deltaTime: number) => {
  const position = entity.components.position;
  const powerUpComp = entity.components.powerUp;

  if (!position || !powerUpComp) return;

  // Update float timer
  powerUpComp.floatTimer += deltaTime;

  // Apply floating animation
  const floatAmplitude = 10;
  const floatFrequency = 2;
  position.y += Math.sin(powerUpComp.floatTimer * floatFrequency) * floatAmplitude * deltaTime;

  // Move downward slowly
  position.y += 50 * deltaTime;
};

// Apply screen boundaries to entity
const applyScreenBoundaries = (entity: GameEntity) => {
  const position = entity.components.position;
  const velocity = entity.components.velocity;

  if (!position) return;

  const width = position.width || 40;
  const height = position.height || 40;

  // Different boundary rules for different entity types
  switch (entity.type) {
    case EntityType.PLAYER:
      // Player stays within screen bounds
      position.x = clamp(position.x, width / 2, SCREEN_WIDTH - width / 2);
      position.y = clamp(position.y, height / 2, SCREEN_HEIGHT - height / 2);
      break;

    case EntityType.ENEMY:
      // Enemies wrap horizontally, but are removed when below screen
      if (position.x < -width) position.x = SCREEN_WIDTH + width;
      if (position.x > SCREEN_WIDTH + width) position.x = -width;
      break;

    case EntityType.BULLET:
      // Bullets bounce off walls if they have ricochet
      const bulletComp = entity.components.bullet;
      if (bulletComp?.ricochet && (bulletComp.currentRicochet || 0) < (bulletComp.ricochetCount || 1)) {
        if (position.x < 0 || position.x > SCREEN_WIDTH) {
          if (velocity) velocity.x = -velocity.x;
          bulletComp.currentRicochet = (bulletComp.currentRicochet || 0) + 1;
          position.x = clamp(position.x, 0, SCREEN_WIDTH);
        }
      }
      break;

    case EntityType.POWER_UP:
      // Power-ups wrap horizontally
      if (position.x < -width) position.x = SCREEN_WIDTH + width;
      if (position.x > SCREEN_WIDTH + width) position.x = -width;
      break;
  }
};