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
export const MovementSystem = (entities: Record<string, GameEntity>, { time }: { time: number }) => {
  const deltaTime = Math.min(time.delta, 100) / 1000; // Convert to seconds, cap at 100ms

  Object.keys(entities).forEach(id => {
    const entity = entities[id];

    // Skip if entity is not active
    if (!entity.active) return;

    // Handle player movement (touch controls)
    if (entity.type === 'player') {
      handlePlayerMovement(entity, deltaTime);
    }

    // Handle enemy movement
    if (entity.type === 'enemy') {
      handleEnemyMovement(entity, deltaTime, time.current);
    }

    // Handle bullet movement
    if (entity.type === 'bullet') {
      handleBulletMovement(entity, deltaTime);
    }

    // Handle power-up movement
    if (entity.type === 'powerUp') {
      handlePowerUpMovement(entity, deltaTime);
    }

    // Apply screen boundaries
    applyScreenBoundaries(entity);
  });

  return entities;
};

// Player movement with touch controls
const handlePlayerMovement = (player: any, deltaTime: number) => {
  if (!player.controls || !player.controls.touchPosition) return;

  const { touchPosition, moveSpeed = 300 } = player.controls;
  const { position } = player;

  // Calculate direction to touch position
  if (touchPosition) {
    const dx = touchPosition.x - position.x;
    const dy = touchPosition.y - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Only move if touch is outside dead zone
    const deadZone = 10;
    if (distance > deadZone) {
      // Normalize direction and apply speed
      const speed = moveSpeed * deltaTime;
      const moveX = (dx / distance) * speed;
      const moveY = (dy / distance) * speed;

      // Apply movement with easing
      const easing = 0.2;
      player.position.x += moveX * easing;
      player.position.y += moveY * easing;

      // Update velocity for visual feedback
      player.velocity = {
        x: moveX * 0.5,
        y: moveY * 0.5,
      };
    } else {
      // Slow down when near target
      player.velocity.x *= 0.9;
      player.velocity.y *= 0.9;
    }
  }
};

// Enemy movement patterns
const handleEnemyMovement = (enemy: any, deltaTime: number, currentTime: number) => {
  const { position, velocity, enemyType } = enemy;

  switch (enemyType) {
    case 'basic':
      // Basic enemy: move downward with slight horizontal oscillation
      position.y += velocity.y * deltaTime;
      position.x += Math.sin(currentTime * 0.001) * 1.5;
      break;

    case 'diving':
      // Diving enemy: dive toward player position if diving
      if (enemy.isDiving && enemy.diveTarget) {
        const dx = enemy.diveTarget.x - position.x;
        const dy = enemy.diveTarget.y - position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 10) {
          const speed = 400 * deltaTime;
          position.x += (dx / distance) * speed;
          position.y += (dy / distance) * speed;
        } else {
          enemy.isDiving = false;
        }
      } else {
        // Move downward when not diving
        position.y += velocity.y * deltaTime;
      }
      break;

    case 'shooting':
      // Shooting enemy: move side-to-side while slowly descending
      position.y += velocity.y * deltaTime * 0.5;
      position.x += Math.sin(currentTime * 0.002) * velocity.x * deltaTime;
      break;

    case 'boss':
      // Boss enemy: slow movement with pattern
      position.y += velocity.y * deltaTime * 0.3;
      position.x += Math.sin(currentTime * 0.0005) * 2;
      break;

    default:
      // Default movement
      position.x += velocity.x * deltaTime;
      position.y += velocity.y * deltaTime;
  }
};

// Bullet movement
const handleBulletMovement = (bullet: any, deltaTime: number) => {
  const { position, velocity, bulletType } = bullet;

  // Different speeds for different bullet types
  let speedMultiplier = 1;
  if (bulletType === 'player') speedMultiplier = 1.2;
  if (bulletType === 'special') speedMultiplier = 1.5;

  position.x += velocity.x * deltaTime * speedMultiplier;
  position.y += velocity.y * deltaTime * speedMultiplier;
};

// Power-up movement (float downward)
const handlePowerUpMovement = (powerUp: any, deltaTime: number) => {
  const { position, velocity } = powerUp;

  // Float downward with slight horizontal drift
  position.x += velocity.x * deltaTime;
  position.y += velocity.y * deltaTime;

  // Add gentle floating motion
  position.x += Math.sin(Date.now() * 0.001) * 0.5;
};

// Apply screen boundaries to keep entities on screen
const applyScreenBoundaries = (entity: any) => {
  const { position, size, type } = entity;

  // Different boundary rules for different entity types
  switch (type) {
    case 'player':
      // Player stays on screen
      position.x = clamp(position.x, size.width / 2, SCREEN_WIDTH - size.width / 2);
      position.y = clamp(position.y, size.height / 2, SCREEN_HEIGHT - size.height / 2);
      break;

    case 'enemy':
      // Enemies wrap horizontally, get removed when off bottom
      if (position.x < -size.width) position.x = SCREEN_WIDTH + size.width;
      if (position.x > SCREEN_WIDTH + size.width) position.x = -size.width;
      break;

    case 'bullet':
      // Bullets get removed when off screen (handled elsewhere)
      break;

    case 'powerUp':
      // Power-ups wrap horizontally
      if (position.x < -size.width) position.x = SCREEN_WIDTH + size.width;
      if (position.x > SCREEN_WIDTH + size.width) position.x = -size.width;
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