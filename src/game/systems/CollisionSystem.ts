// Collision System for Entity-Component-System architecture
// Uses spatial partitioning for efficient collision detection

import { GameEntity, BoundingBox } from '../../types';
import { checkAABBCollision, getBoundingBox, SpatialGrid } from '../../utils/collision';

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

// Component for collision data
export interface CollisionComponent {
  bounds: BoundingBox;
  collisionLayer: 'player' | 'enemy' | 'bullet' | 'powerUp';
  damage?: number;
  invulnerable?: boolean;
  invulnerableUntil?: number;
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

    const bounds = getBoundingBox(entity.position, entity.size);
    spatialGrid.insert(id, bounds);
  });

  // Second pass: check for collisions using spatial grid
  Object.keys(entities).forEach(id => {
    const entity = entities[id];
    if (!entity.active) return;

    const bounds = getBoundingBox(entity.position, entity.size);
    const potentialCollisions = spatialGrid.getPotentialCollisions(id, bounds);

    potentialCollisions.forEach(otherId => {
      const otherEntity = entities[otherId];
      if (!otherEntity.active) return;

      const otherBounds = getBoundingBox(otherEntity.position, otherEntity.size);

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
const getCollisionType = (type1: string, type2: string): CollisionType | null => {
  const types = [type1, type2].sort().join('-');

  switch (types) {
    case 'enemy-player':
      return 'player-enemy';
    case 'powerUp-player':
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

  switch (type) {
    case 'player-enemy':
      handlePlayerEnemyCollision(entity1Obj, entity2Obj, position, currentTime, dispatch);
      break;

    case 'player-powerUp':
      handlePlayerPowerUpCollision(entity1Obj, entity2Obj, position, dispatch);
      break;

    case 'bullet-enemy':
      handleBulletEnemyCollision(entity1Obj, entity2Obj, position, dispatch);
      break;

    case 'bullet-player':
      handleBulletPlayerCollision(entity1Obj, entity2Obj, position, currentTime, dispatch);
      break;

    case 'enemy-enemy':
      // Enemies bounce off each other
      handleEnemyEnemyCollision(entity1Obj, entity2Obj);
      break;
  }
};

// Player-Enemy collision
const handlePlayerEnemyCollision = (
  player: any,
  enemy: any,
  position: { x: number; y: number },
  currentTime: number,
  dispatch: (event: any) => void
) => {
  // Check if player is invulnerable (e.g., after hit or shield)
  if (player.invulnerable && player.invulnerableUntil > currentTime) {
    return;
  }

  // Player takes damage
  const damage = enemy.damage || 10;
  player.health = Math.max(0, player.health - damage);

  // Make player invulnerable briefly
  player.invulnerable = true;
  player.invulnerableUntil = currentTime + 1000; // 1 second invulnerability

  // Enemy takes damage (if it can be damaged by collision)
  if (enemy.health !== undefined) {
    const enemyDamage = player.collisionDamage || 5;
    enemy.health = Math.max(0, enemy.health - enemyDamage);
  }

  // Dispatch collision event
  dispatch({
    type: 'collision',
    data: {
      collisionType: 'player-enemy',
      position,
      damage,
      playerHealth: player.health,
      enemyHealth: enemy.health,
    },
  });

  // If player health reaches 0
  if (player.health <= 0) {
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
  if (enemy.health <= 0) {
    enemy.active = false;
    dispatch({
      type: 'enemyDestroyed',
      data: {
        position,
        enemyType: enemy.enemyType,
        points: enemy.points || 100,
      },
    });
  }
};

// Player-PowerUp collision
const handlePlayerPowerUpCollision = (
  player: any,
  powerUp: any,
  position: { x: number; y: number },
  dispatch: (event: any) => void
) => {
  // Apply power-up effect
  applyPowerUpEffect(player, powerUp.powerUpType);

  // Deactivate power-up
  powerUp.active = false;

  // Dispatch event
  dispatch({
    type: 'powerUpCollect',
    data: {
      position,
      powerUpType: powerUp.powerUpType,
      duration: powerUp.duration || 10000,
    },
  });
};

// Bullet-Enemy collision
const handleBulletEnemyCollision = (
  bullet: any,
  enemy: any,
  position: { x: number; y: number },
  dispatch: (event: any) => void
) => {
  // Skip if bullet doesn't damage enemies or enemy is invulnerable
  if (bullet.bulletType !== 'player' && bullet.bulletType !== 'special') return;
  if (enemy.invulnerable) return;

  // Apply damage
  const damage = bullet.damage || 25;
  enemy.health = Math.max(0, enemy.health - damage);

  // Deactivate bullet
  bullet.active = false;

  // Dispatch hit event
  dispatch({
    type: 'collision',
    data: {
      collisionType: 'bullet-enemy',
      position,
      damage,
      enemyHealth: enemy.health,
    },
  });

  // If enemy is destroyed
  if (enemy.health <= 0) {
    enemy.active = false;
    dispatch({
      type: 'enemyDestroyed',
      data: {
        position,
        enemyType: enemy.enemyType,
        points: enemy.points || 100,
      },
    });
  }
};

// Bullet-Player collision (enemy bullets hitting player)
const handleBulletPlayerCollision = (
  bullet: any,
  player: any,
  position: { x: number; y: number },
  currentTime: number,
  dispatch: (event: any) => void
) => {
  // Skip if player is invulnerable
  if (player.invulnerable && player.invulnerableUntil > currentTime) return;

  // Apply damage
  const damage = bullet.damage || 20;
  player.health = Math.max(0, player.health - damage);

  // Make player invulnerable briefly
  player.invulnerable = true;
  player.invulnerableUntil = currentTime + 1000;

  // Deactivate bullet
  bullet.active = false;

  // Dispatch events
  dispatch({
    type: 'collision',
    data: {
      collisionType: 'bullet-player',
      position,
      damage,
      playerHealth: player.health,
    },
  });

  dispatch({
    type: 'playerHit',
    data: { position, fatal: player.health <= 0 },
  });
};

// Enemy-Enemy collision (bounce off each other)
const handleEnemyEnemyCollision = (enemy1: any, enemy2: any) => {
  // Simple bounce: reverse velocities
  const tempVel = { ...enemy1.velocity };
  enemy1.velocity = { ...enemy2.velocity };
  enemy2.velocity = tempVel;

  // Move them apart slightly
  const dx = enemy2.position.x - enemy1.position.x;
  const dy = enemy2.position.y - enemy1.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > 0) {
    const overlap = (enemy1.size.width + enemy2.size.width) / 2 - distance;
    if (overlap > 0) {
      const moveX = (dx / distance) * overlap * 0.5;
      const moveY = (dy / distance) * overlap * 0.5;

      enemy1.position.x -= moveX;
      enemy1.position.y -= moveY;
      enemy2.position.x += moveX;
      enemy2.position.y += moveY;
    }
  }
};

// Apply power-up effect to player
const applyPowerUpEffect = (player: any, powerUpType: string) => {
  const currentTime = Date.now();

  switch (powerUpType) {
    case 'shield':
      player.shieldActive = true;
      player.shieldEndTime = currentTime + 10000; // 10 seconds
      break;

    case 'rapidFire':
      player.rapidFireActive = true;
      player.rapidFireEndTime = currentTime + 8000; // 8 seconds
      player.shootCooldown = 100; // Reduced from 300ms
      break;

    case 'multiShot':
      player.multiShotActive = true;
      player.multiShotEndTime = currentTime + 12000; // 12 seconds
      break;

    case 'bomb':
      // Screen-clearing bomb effect handled elsewhere
      player.bombCount = (player.bombCount || 0) + 1;
      break;
  }

  // Add to player's active power-ups
  if (!player.activePowerUps) player.activePowerUps = [];
  player.activePowerUps.push({
    type: powerUpType,
    endTime: currentTime + (powerUpType === 'shield' ? 10000 :
                          powerUpType === 'rapidFire' ? 8000 :
                          powerUpType === 'multiShot' ? 12000 : 0),
  });
};

// Helper to create collision component
export const createCollisionComponent = (
  collisionLayer: 'player' | 'enemy' | 'bullet' | 'powerUp',
  damage?: number
): CollisionComponent => ({
  bounds: { x: 0, y: 0, width: 0, height: 0 }, // Will be calculated
  collisionLayer,
  damage,
  invulnerable: false,
});

// Check if entity is off-screen (for cleanup)
export const isOffScreen = (entity: GameEntity, screenWidth: number, screenHeight: number): boolean => {
  const { position, size } = entity;

  // Different rules for different entity types
  switch (entity.type) {
    case 'bullet':
      // Bullets are off-screen if completely outside
      return (
        position.x < -size.width ||
        position.x > screenWidth + size.width ||
        position.y < -size.height ||
        position.y > screenHeight + size.height
      );

    case 'enemy':
      // Enemies are off-screen if below bottom (fell off)
      return position.y > screenHeight + size.height;

    case 'powerUp':
      // Power-ups are off-screen if below bottom
      return position.y > screenHeight + size.height;

    default:
      return false;
  }
};