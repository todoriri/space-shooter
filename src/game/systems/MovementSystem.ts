// Movement System for Entity-Component-System architecture
// Handles position updates, velocity application, and screen boundaries

import { Dimensions } from 'react-native';
import { GameEntity, Position, Velocity } from '../../types';
import { clamp } from '../../utils/math';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Component types for movement
export interface MovementComponent {
  velocity: Velocity;
  maxSpeed?: number;
  friction?: number; // 0 = no friction, 1 = instant stop
  bounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export interface TouchControlComponent {
  touchPosition: Position | null;
  touchRadius: number;
  moveSpeed: number;
}

// System function that processes all entities with movement components
export const MovementSystem = (entities: Record<string, GameEntity>, { time }: { time: { delta: number; current: number } }) => {
  const deltaTime = Math.min(time.delta || 16.67, 100) / 1000;

  Object.keys(entities).forEach(id => {
    const entity = entities[id];

    if (!entity.active) return;

    const position = entity.components.position;
    const velocity = entity.components.velocity;

    if (position && velocity) {
      if (entity.type === 'player') {
        // Player movement is mostly handled by PlayerSystem (direct position updates for responsiveness)
        // But we apply horizontal drift or small adjustments here if needed
        position.x += velocity.x * deltaTime;
        position.y += velocity.y * deltaTime;
      } else if (entity.type === 'enemy') {
        handleEnemyMovement(entity, deltaTime, time.current);
      } else if (entity.type === 'bullet') {
        handleBulletMovement(entity, deltaTime);
      } else if (entity.type === 'powerUp') {
        handlePowerUpMovement(entity, deltaTime);
      } else {
        // Default movement
        position.x += velocity.x * deltaTime;
        position.y += velocity.y * deltaTime;
      }

      // Apply friction if present in velocity component (standardization)
      if (velocity.friction) {
        velocity.x *= (1 - velocity.friction * deltaTime);
        velocity.y *= (1 - velocity.friction * deltaTime);
      }
    }

    applyScreenBoundaries(entity);
  });

  return entities;
};

// Enemy movement patterns
const handleEnemyMovement = (enemy: GameEntity, deltaTime: number, currentTime: number) => {
  const position = enemy.components.position;
  const velocity = enemy.components.velocity;
  const enemyComp = enemy.components.enemy;

  if (!position || !velocity) return;

  const enemyType = enemyComp?.type || 'basic';

  switch (enemyType) {
    case 'basic':
      position.y += velocity.y * deltaTime;
      position.x += Math.sin(currentTime * 0.001) * 1.5;
      break;

    case 'diving':
      // Simplified diving check
      position.y += velocity.y * deltaTime;
      break;

    case 'shooting':
      position.y += velocity.y * deltaTime * 0.5;
      position.x += Math.sin(currentTime * 0.002) * (velocity.x || 50) * deltaTime;
      break;

    case 'boss':
      position.y += velocity.y * deltaTime * 0.3;
      position.x += Math.sin(currentTime * 0.0005) * 2;
      break;

    default:
      position.x += velocity.x * deltaTime;
      position.y += velocity.y * deltaTime;
  }
};

// Bullet movement
const handleBulletMovement = (bullet: GameEntity, deltaTime: number) => {
  const position = bullet.components.position;
  const velocity = bullet.components.velocity;
  if (!position || !velocity) return;

  position.x += velocity.x * deltaTime;
  position.y += velocity.y * deltaTime;
};

// Power-up movement (float downward)
const handlePowerUpMovement = (powerUp: GameEntity, deltaTime: number) => {
  const position = powerUp.components.position;
  const velocity = powerUp.components.velocity;
  if (!position || !velocity) return;

  position.x += velocity.x * deltaTime;
  position.y += velocity.y * deltaTime;

  // Add gentle floating motion
  position.x += Math.sin(Date.now() * 0.001) * 0.5;
};

// Apply screen boundaries to keep entities on screen
const applyScreenBoundaries = (entity: GameEntity) => {
  const position = entity.components.position;
  if (!position) return;

  const width = position.width || 0;
  const height = position.height || 0;

  // Different boundary rules for different entity types
  switch (entity.type) {
    case 'player':
      // Player stays on screen
      position.x = Math.max(width / 2, Math.min(SCREEN_WIDTH - width / 2, position.x));
      position.y = Math.max(height / 2, Math.min(SCREEN_HEIGHT - height / 2, position.y));
      break;

    case 'enemy':
      // Enemies wrap horizontally
      if (position.x < -width) position.x = SCREEN_WIDTH + width;
      if (position.x > SCREEN_WIDTH + width) position.x = -width;
      break;

    case 'powerUp':
      // Power-ups wrap horizontally
      if (position.x < -width) position.x = SCREEN_WIDTH + width;
      if (position.x > SCREEN_WIDTH + width) position.x = -width;
      break;
  }
};

// Helper to create movement component
export const createMovementComponent = (
  velocity: Velocity = { x: 0, y: 0 },
  options: Partial<MovementComponent> = {}
): MovementComponent => ({
  velocity,
  maxSpeed: options.maxSpeed || 500,
  friction: options.friction || 0.95,
  bounds: options.bounds || {
    minX: 0,
    maxX: SCREEN_WIDTH,
    minY: 0,
    maxY: SCREEN_HEIGHT,
  },
});

// Helper to create touch control component
export const createTouchControlComponent = (
  moveSpeed: number = 300,
  touchRadius: number = 50
): TouchControlComponent => ({
  touchPosition: null,
  touchRadius,
  moveSpeed,
});