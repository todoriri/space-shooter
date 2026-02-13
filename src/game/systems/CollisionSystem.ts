// Collision System for Entity-Component-System architecture
// Uses spatial partitioning for efficient collision detection

import { GameEntity, BoundingBox, BulletType, PowerUpType } from '../../types';
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
    if (!entity.active || !entity.components.position) return;

    const position = entity.components.position;
    const bounds = getBoundingBox(position, {
      width: position.width || 0,
      height: position.height || 0
    });
    spatialGrid.insert(id, bounds);
  });

  // Second pass: check for collisions
  Object.keys(entities).forEach(id => {
    const entity = entities[id];
    if (!entity.active || !entity.components.position) return;

    const position = entity.components.position;
    const bounds = getBoundingBox(position, {
      width: position.width || 0,
      height: position.height || 0
    });
    const potentialCollisions = spatialGrid.getPotentialCollisions(id, bounds);

    potentialCollisions.forEach(otherId => {
      const otherEntity = entities[otherId];
      if (!otherEntity.active || !otherEntity.components.position) return;

      const otherPosition = otherEntity.components.position;
      const otherBounds = getBoundingBox(otherPosition, {
        width: otherPosition.width || 0,
        height: otherPosition.height || 0
      });

      if (checkAABBCollision(bounds, otherBounds)) {
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
    case 'player-powerUp':
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
      handleEnemyEnemyCollision(entity1Obj, entity2Obj);
      break;
  }
};

// Player-Enemy collision
const handlePlayerEnemyCollision = (
  player: GameEntity,
  enemy: GameEntity,
  position: { x: number; y: number },
  currentTime: number,
  dispatch: (event: any) => void
) => {
  const playerHealth = player.components.health;
  const enemyHealth = enemy.components.health;

  if (!playerHealth) return;

  if (playerHealth.invulnerable && (playerHealth.invulnerableTimer || 0) > currentTime) {
    return;
  }

  // Player takes damage
  const damage = 10;
  playerHealth.current = Math.max(0, playerHealth.current - damage);
  playerHealth.invulnerable = true;
  playerHealth.invulnerableTimer = currentTime + 1000;

  if (enemyHealth) {
    enemyHealth.current = 0;
  }

  dispatch({
    type: 'collision',
    data: {
      collisionType: 'player-enemy',
      position,
      damage,
      playerHealth: playerHealth.current,
    },
  });

  if (playerHealth.current <= 0) {
    dispatch({ type: 'gameOver', data: { reason: 'noLives' } });
  } else {
    dispatch({ type: 'playerHit', data: { position, fatal: false } });
  }

  if (enemyHealth && enemyHealth.current <= 0) {
    enemy.active = false;
    dispatch({
      type: 'enemyDestroyed',
      data: {
        position,
        enemyType: enemy.components.enemy?.type,
        points: enemy.components.enemy?.scoreValue || 100,
      },
    });
  }
};

// Player-PowerUp collision
const handlePlayerPowerUpCollision = (
  player: GameEntity,
  powerUp: GameEntity,
  position: { x: number; y: number },
  dispatch: (event: any) => void
) => {
  const powerUpComp = powerUp.components.powerUp;
  if (!powerUpComp) return;

  // Apply power-up effect
  applyPowerUpEffect(player, powerUpComp.type);

  // Deactivate power-up
  powerUp.active = false;

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
  bullet: GameEntity,
  enemy: GameEntity,
  position: { x: number; y: number },
  dispatch: (event: any) => void
) => {
  const bulletComp = bullet.components.bullet;
  const enemyHealth = enemy.components.health;
  const enemyComp = enemy.components.enemy;

  if (!bulletComp || !enemyHealth) return;

  // Skip if bullet doesn't damage enemies
  if (bulletComp.type !== BulletType.PLAYER) return;

  // Apply damage
  const damage = bulletComp.damage || 25;
  enemyHealth.current = Math.max(0, enemyHealth.current - damage);

  // Deactivate bullet
  bullet.active = false;

  // Dispatch hit event
  dispatch({
    type: 'collision',
    data: {
      collisionType: 'bullet-enemy',
      position,
      damage,
      enemyHealth: enemyHealth.current,
    },
  });

  // If enemy is destroyed
  if (enemyHealth.current <= 0) {
    enemy.active = false;
    dispatch({
      type: 'enemyDestroyed',
      data: {
        position,
        enemyType: enemyComp?.type,
        points: enemyComp?.scoreValue || 100,
      },
    });
  }
};

// Bullet-Player collision (enemy bullets hitting player)
const handleBulletPlayerCollision = (
  bullet: GameEntity,
  player: GameEntity,
  position: { x: number; y: number },
  currentTime: number,
  dispatch: (event: any) => void
) => {
  const bulletComp = bullet.components.bullet;
  const playerHealth = player.components.health;

  if (!bulletComp || !playerHealth) return;

  // Skip if player is invulnerable
  if (playerHealth.invulnerable && (playerHealth.invulnerableTimer || 0) > currentTime) return;

  // Apply damage
  const damage = bulletComp.damage || 20;
  playerHealth.current = Math.max(0, playerHealth.current - damage);

  // Make player invulnerable briefly
  playerHealth.invulnerable = true;
  playerHealth.invulnerableTimer = currentTime + 1000;

  // Deactivate bullet
  bullet.active = false;

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
  const pos1 = enemy1.components.position;
  const pos2 = enemy2.components.position;
  const vel1 = enemy1.components.velocity;
  const vel2 = enemy2.components.velocity;

  if (!pos1 || !pos2 || !vel1 || !vel2) return;

  // Simple bounce: reverse velocities
  const tempVel = { x: vel1.x, y: vel1.y };
  vel1.x = vel2.x;
  vel1.y = vel2.y;
  vel2.x = tempVel.x;
  vel2.y = tempVel.y;

  // Move them apart slightly
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const width1 = pos1.width || 20;
  const width2 = pos2.width || 20;

  if (distance > 0) {
    const overlap = (width1 + width2) / 2 - distance;
    if (overlap > 0) {
      const moveX = (dx / distance) * overlap * 0.5;
      const moveY = (dy / distance) * overlap * 0.5;

      pos1.x -= moveX;
      pos1.y -= moveY;
      pos2.x += moveX;
      pos2.y += moveY;
    }
  }
};

// Apply power-up effect to player
const applyPowerUpEffect = (player: GameEntity, powerUpType: string) => {
  const playerComp = player.components.player;
  if (!playerComp) return;

  const currentTime = Date.now();

  switch (powerUpType) {
    case 'shield':
      playerComp.shieldActive = true;
      playerComp.shieldEndTime = currentTime + 10000;
      break;

    case 'rapidFire':
      playerComp.rapidFireActive = true;
      playerComp.rapidFireEndTime = currentTime + 8000;
      playerComp.shootCooldown = 100;
      break;

    case 'multiShot':
      playerComp.multiShotActive = true;
      playerComp.multiShotEndTime = currentTime + 12000;
      break;

    case 'bomb':
      // Screen-clearing bomb effect handled elsewhere
      playerComp.bombCount = (playerComp.bombCount || 0) + 1;
      break;
  }

  // Add to player's active power-ups
  if (!playerComp.activePowerUps) playerComp.activePowerUps = [];
  playerComp.activePowerUps.push({
    type: powerUpType as PowerUpType,
    endTime: currentTime + (powerUpType === 'shield' ? 10000 :
      powerUpType === 'rapidFire' ? 8000 :
        powerUpType === 'multiShot' ? 12000 : 0),
    effectApplied: true,
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
  const position = entity.components.position;
  if (!position) return false;

  const width = position.width || 0;
  const height = position.height || 0;

  // Different rules for different entity types
  switch (entity.type) {
    case 'bullet':
      return (
        position.x < -width ||
        position.x > screenWidth + width ||
        position.y < -height ||
        position.y > screenHeight + height
      );

    case 'enemy':
      return position.y > screenHeight + height;

    case 'powerUp':
      return position.y > screenHeight + height;

    default:
      return false;
  }
};