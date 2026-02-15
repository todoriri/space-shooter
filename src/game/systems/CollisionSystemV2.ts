// Collision System for Entity-Component-System architecture
// Uses spatial partitioning for efficient collision detection
// Updated to work with proper ECS component structure

import { GameEntity, EntityType, EnemyType, BulletType, PowerUpType } from '../../types';
import { checkAABBCollision, getBoundingBox, SpatialGrid } from '../../utils/collision';
import { releaseBullet } from '../entities/Bullet';
import { releaseEnemy } from '../entities/Enemy';
import { createRandomPowerUpDrop } from '../entities/PowerUp';

// Collision types
export type CollisionType =
  | 'player-enemy'
  | 'player-powerUp'
  | 'bullet-enemy'
  | 'bullet-player'
  | 'enemy-enemy';

export interface CollisionEvent {
  type: CollisionType;
  entity1: string;
  entity2: string;
  position: { x: number; y: number };
}

// System function that processes collisions
export const CollisionSystem = (
  entities: Record<string, GameEntity>,
  { time, dispatch }: { time: { current: number }; dispatch: (event: any) => void }
) => {
  const spatialGrid = new SpatialGrid(100); // 100px cell size
  const collisions: CollisionEvent[] = [];

  // First pass: insert all entities into spatial grid
  Object.keys(entities).forEach(id => {
    const entity = entities[id];
    if (!entity.active) return;

    const position = entity.components.position;
    if (!position) return;

    const bounds = getBoundingBox(
      { x: position.x, y: position.y },
      { width: position.width || 40, height: position.height || 40 }
    );
    spatialGrid.insert(id, bounds);
  });

  // Second pass: check for collisions using spatial grid
  Object.keys(entities).forEach(id => {
    const entity = entities[id];
    if (!entity.active) return;

    const position = entity.components.position;
    if (!position) return;

    const bounds = getBoundingBox(
      { x: position.x, y: position.y },
      { width: position.width || 40, height: position.height || 40 }
    );
    const potentialCollisions = spatialGrid.getPotentialCollisions(id, bounds);

    potentialCollisions.forEach(otherId => {
      const otherEntity = entities[otherId];
      if (!otherEntity.active) return;

      const otherPosition = otherEntity.components.position;
      if (!otherPosition) return;

      const otherBounds = getBoundingBox(
        { x: otherPosition.x, y: otherPosition.y },
        { width: otherPosition.width || 40, height: otherPosition.height || 40 }
      );

      // Check if bounding boxes overlap
      if (checkAABBCollision(bounds, otherBounds)) {
        // Determine collision type
        const collisionType = getCollisionType(entity.type, otherEntity.type);

        if (collisionType) {
          collisions.push({
            type: collisionType,
            entity1: id,
            entity2: otherId,
            position: {
              x: (bounds.x + otherBounds.x) / 2,
              y: (bounds.y + otherBounds.y) / 2,
            },
          });
        }
      }
    });
  });

  // Process collisions and dispatch events
  collisions.forEach(collision => {
    handleCollision(collision, entities, time.current, dispatch);
  });

  return entities;
};

// Determine collision type based on entity types
const getCollisionType = (type1: EntityType, type2: EntityType): CollisionType | null => {
  const types = [type1, type2].sort().join('-');

  switch (types) {
    case 'enemy-player':
      return 'player-enemy';
    case 'player-powerUp': // Fixed: sorted order is 'player' then 'powerUp' alphabetically
      return 'player-powerUp';
    case 'bullet-enemy':
      return 'bullet-enemy';
    case 'bullet-player':
      return 'bullet-player';
    case 'enemy-enemy':
      return 'enemy-enemy';
    default:
      return null;
  }
};

// Handle collision based on type
const handleCollision = (
  collision: CollisionEvent,
  entities: Record<string, GameEntity>,
  currentTime: number,
  dispatch: (event: any) => void
) => {
  const { type, entity1, entity2, position } = collision;
  const entity1Obj = entities[entity1];
  const entity2Obj = entities[entity2];

  if (!entity1Obj || !entity2Obj) return;



  switch (type) {
    case 'player-enemy':
      if (entity1Obj.type === EntityType.PLAYER) {
        handlePlayerEnemyCollision(entity1Obj, entity2Obj, position, currentTime, entities, dispatch);
      } else {
        handlePlayerEnemyCollision(entity2Obj, entity1Obj, position, currentTime, entities, dispatch);
      }
      break;

    case 'player-powerUp':
      if (entity1Obj.type === EntityType.PLAYER) {
        handlePlayerPowerUpCollision(entity1Obj, entity2Obj, position, dispatch);
      } else {
        handlePlayerPowerUpCollision(entity2Obj, entity1Obj, position, dispatch);
      }
      break;

    case 'bullet-enemy':
      if (entity1Obj.type === EntityType.BULLET) {
        handleBulletEnemyCollision(entity1Obj, entity2Obj, position, entities, dispatch);
      } else {
        handleBulletEnemyCollision(entity2Obj, entity1Obj, position, entities, dispatch);
      }
      break;

    case 'bullet-player':
      if (entity1Obj.type === EntityType.BULLET) {
        handleBulletPlayerCollision(entity1Obj, entity2Obj, position, currentTime, entities, dispatch);
      } else {
        handleBulletPlayerCollision(entity2Obj, entity1Obj, position, currentTime, entities, dispatch);
      }
      break;

    case 'enemy-enemy':
      // Order doesn't matter for enemy-enemy
      handleEnemyEnemyCollision(entity1Obj, entity2Obj);
      break;
  }
};

// Player-Enemy collision
const handlePlayerEnemyCollision = (
  playerEntity: GameEntity,
  enemyEntity: GameEntity,
  position: { x: number; y: number },
  currentTime: number,
  entities: Record<string, GameEntity>,
  dispatch: (event: any) => void
) => {
  const playerHealth = playerEntity.components.health;
  const enemyHealth = enemyEntity.components.health;
  const playerComp = playerEntity.components.player;
  const enemyComp = enemyEntity.components.enemy;

  if (!playerHealth || !playerComp) return;

  // Check if player is invulnerable
  if (playerHealth.invulnerable && (playerHealth.invulnerableTimer || 0) > currentTime) {
    return;
  }

  // Player takes damage
  const damage = 10; // Base damage from enemy collision
  playerHealth.current = Math.max(0, playerHealth.current - damage);

  // Make player invulnerable briefly
  playerHealth.invulnerable = true;
  playerHealth.invulnerableTimer = currentTime + 1000; // 1 second invulnerability in ms

  // Enemy takes damage (if it can be damaged by collision)
  if (enemyHealth) {
    const enemyDamage = 5; // Player collision damage to enemy
    enemyHealth.current = Math.max(0, enemyHealth.current - enemyDamage);
  }

  // Dispatch collision event
  dispatch({
    type: 'collision',
    data: {
      collisionType: 'player-enemy',
      position,
      damage,
      playerHealth: playerHealth.current,
      enemyHealth: enemyHealth?.current,
    },
  });

  // If player health reaches 0
  if (playerHealth.current <= 0) {
    dispatch({
      type: 'playerHit',
      data: { position, fatal: true },
    });
  } else {
    dispatch({
      type: 'playerHit',
      data: { position, fatal: false },
    });
  }

  // If enemy health reaches 0
  if (enemyHealth && enemyHealth.current <= 0) {
    releaseEnemy(enemyEntity);
    delete entities[enemyEntity.id];

    // Add score from enemy destruction
    if (playerComp && enemyComp) {
      playerComp.score += enemyComp.scoreValue || 100;
    }

    dispatch({
      type: 'enemyDestroyed',
      data: {
        position,
        enemyType: enemyComp?.type || 'unknown',
        points: enemyComp?.scoreValue || 100,
      },
    });

    // Chance to drop power-up
    const powerUp = createRandomPowerUpDrop(position, 0.15); // 15% chance
    if (powerUp) {
      entities[powerUp.id] = powerUp;
      dispatch({
        type: 'powerUpDrop',
        data: {
          position,
          powerUpType: powerUp.components.powerUp?.type,
        },
      });
    }
  }
};

// Player-PowerUp collision
const handlePlayerPowerUpCollision = (
  playerEntity: GameEntity,
  powerUpEntity: GameEntity,
  position: { x: number; y: number },
  dispatch: (event: any) => void
) => {
  const playerComp = playerEntity.components.player;
  const powerUpComp = powerUpEntity.components.powerUp;

  if (!playerComp || !powerUpComp) return;

  // Mark power-up as collected with timestamp
  powerUpComp.collected = true;
  powerUpComp.collectedTime = Date.now();

  // Deactivate power-up entity
  powerUpEntity.active = false;

  // Dispatch event
  dispatch({
    type: 'powerUpCollect',
    data: {
      position,
      powerUpType: powerUpComp.type,
      duration: powerUpComp.duration || 10000,
    },
  });
};

// Bullet-Enemy collision
const handleBulletEnemyCollision = (
  bulletEntity: GameEntity,
  enemyEntity: GameEntity,
  position: { x: number; y: number },
  entities: Record<string, GameEntity>,
  dispatch: (event: any) => void
) => {
  const bulletComp = bulletEntity.components.bullet;
  const enemyHealth = enemyEntity.components.health;
  const enemyComp = enemyEntity.components.enemy;
  const playerEntity = findPlayerEntity(entities);

  // Skip if bullet doesn't damage enemies or enemy is invulnerable
  if (!bulletComp || bulletComp.type !== BulletType.PLAYER) return;
  if (enemyHealth?.invulnerable) return;

  // Apply damage
  const damage = bulletComp.damage || 25;
  if (enemyHealth) {
    enemyHealth.current = Math.max(0, enemyHealth.current - damage);
  }

  // Handle pierce logic
  if (bulletComp.pierce > 1) {
    bulletComp.currentPierce = (bulletComp.currentPierce || bulletComp.pierce) - 1;
    if (bulletComp.currentPierce <= 0) {
      releaseBullet(bulletEntity);
      delete entities[bulletEntity.id];
    }
  } else {
    // Default behavior for non-piercing bullets
    releaseBullet(bulletEntity);
    delete entities[bulletEntity.id];
  }

  // Dispatch hit event
  dispatch({
    type: 'collision',
    data: {
      collisionType: 'bullet-enemy',
      position,
      damage,
      enemyHealth: enemyHealth?.current,
    },
  });

  // If enemy is destroyed
  if (enemyHealth && enemyHealth.current <= 0) {
    releaseEnemy(enemyEntity);
    delete entities[enemyEntity.id];

    // Add score to player
    if (playerEntity?.components.player && enemyComp) {
      playerEntity.components.player.score += enemyComp.scoreValue || 100;
    }

    dispatch({
      type: 'enemyDestroyed',
      data: {
        position,
        enemyType: enemyComp?.type || 'unknown',
        points: enemyComp?.scoreValue || 100,
      },
    });

    // Chance to drop power-up
    const powerUp = createRandomPowerUpDrop(position, 0.15); // 15% chance
    if (powerUp) {
      entities[powerUp.id] = powerUp;
      dispatch({
        type: 'powerUpDrop',
        data: {
          position,
          powerUpType: powerUp.components.powerUp?.type,
        },
      });
    }
  }
};

// Bullet-Player collision (enemy bullets hitting player)
const handleBulletPlayerCollision = (
  bulletEntity: GameEntity,
  playerEntity: GameEntity,
  position: { x: number; y: number },
  currentTime: number,
  entities: Record<string, GameEntity>,
  dispatch: (event: any) => void
) => {
  const bulletComp = bulletEntity.components.bullet;
  const playerHealth = playerEntity.components.health;
  const playerComp = playerEntity.components.player;

  if (!bulletComp || !playerHealth || !playerComp) return;

  // Skip if player is invulnerable
  if (playerHealth.invulnerable && (playerHealth.invulnerableTimer || 0) > currentTime) return;

  // Apply damage
  const damage = bulletComp.damage || 20;
  playerHealth.current = Math.max(0, playerHealth.current - damage);

  // Make player invulnerable briefly
  playerHealth.invulnerable = true;
  playerHealth.invulnerableTimer = currentTime + 1000;

  // Deactivate bullet
  releaseBullet(bulletEntity);
  delete entities[bulletEntity.id];

  // Dispatch events
  dispatch({
    type: 'collision',
    data: {
      collisionType: 'bullet-player',
      position,
      damage,
      playerHealth: playerHealth.current,
    },
  });

  dispatch({
    type: 'playerHit',
    data: { position, fatal: playerHealth.current <= 0 },
  });
};

// Enemy-Enemy collision (bounce off each other)
const handleEnemyEnemyCollision = (enemy1: GameEntity, enemy2: GameEntity) => {
  const velocity1 = enemy1.components.velocity;
  const velocity2 = enemy2.components.velocity;
  const position1 = enemy1.components.position;
  const position2 = enemy2.components.position;

  if (!velocity1 || !velocity2 || !position1 || !position2) return;

  // Simple bounce: reverse velocities
  const tempVel = { ...velocity1 };
  enemy1.components.velocity = { ...velocity2 };
  enemy2.components.velocity = tempVel;

  // Move them apart slightly
  const dx = position2.x - position1.x;
  const dy = position2.y - position1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > 0) {
    const overlap = ((position1.width || 40) + (position2.width || 40)) / 2 - distance;
    if (overlap > 0) {
      const moveX = (dx / distance) * overlap * 0.5;
      const moveY = (dy / distance) * overlap * 0.5;

      position1.x -= moveX;
      position1.y -= moveY;
      position2.x += moveX;
      position2.y += moveY;
    }
  }
};

// Apply power-up effect to player

// Helper to find player entity
const findPlayerEntity = (entities: Record<string, GameEntity>): GameEntity | null => {
  for (const id in entities) {
    if (entities[id].type === EntityType.PLAYER) {
      return entities[id];
    }
  }
  return null;
};

// Check if entity is off-screen (for cleanup)
export const isOffScreen = (entity: GameEntity, screenWidth: number, screenHeight: number): boolean => {
  const position = entity.components.position;
  if (!position) return false;

  const width = position.width || 40;
  const height = position.height || 40;

  // Different rules for different entity types
  switch (entity.type) {
    case EntityType.BULLET:
      // Bullets are off-screen if completely outside
      return (
        position.x < -width ||
        position.x > screenWidth + width ||
        position.y < -height ||
        position.y > screenHeight + height
      );

    case EntityType.ENEMY:
      // Enemies are off-screen if below bottom (fell off)
      return position.y > screenHeight + height;

    case EntityType.POWER_UP:
      // Power-ups are off-screen if below bottom
      return position.y > screenHeight + height;

    default:
      return false;
  }
};