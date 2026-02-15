import { GameEntity, Position, Velocity, EntityType, BulletType } from '../../types';
import { EntityPool } from '../../utils/EntityPool';

// Bullet Pool Instance
const bulletPool = new EntityPool<GameEntity>(
  () => ({
    id: `bullet_${Date.now()}_${Math.random()}`,
    type: EntityType.BULLET,
    active: true,
    tags: ['bullet', 'projectile'],
    components: {}
  }),
  (entity) => {
    entity.active = true;
    entity.tags = ['bullet', 'projectile'];
    return entity;
  },
  50, // Initial size
  200 // Max size
);

/**
 * Release a bullet back to the pool
 * @param bullet - Bullet entity to release
 */
export const releaseBullet = (bullet: GameEntity): void => {
  bullet.active = false;
  bulletPool.release(bullet);
};

/**
 * Creates a bullet entity
 * @param position - Starting position of the bullet
 * @param velocity - Initial velocity of the bullet
 * @param bulletType - Type of bullet (player or enemy)
 * @param ownerId - ID of the entity that fired the bullet
 * @returns A complete bullet entity
 */
export const createBulletEntity = (
  position: Position,
  velocity: Velocity,
  bulletType: BulletType = BulletType.PLAYER,
  ownerId?: string
): GameEntity => {
  const bullet = bulletPool.acquire();
  bullet.id = `bullet_${bulletType}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  // Base bullet configuration is already set by pool factory/reset
  // We just need to attach specific components

  // Bullet type specific configurations
  const bulletConfigs = {
    [BulletType.PLAYER]: {
      components: {
        position: {
          ...position,
          width: 10,
          height: 20,
          rotation: 0,
        },
        velocity: {
          ...velocity,
          maxSpeed: 800,
          acceleration: 0, // Bullets maintain constant velocity
          friction: 0,
        },
        bullet: {
          type: BulletType.PLAYER,
          damage: 10,
          pierce: 1, // Number of enemies it can pass through
          currentPierce: 1,
          ownerId: ownerId || 'player',
          lifetime: 3.0, // Seconds before auto-destroy
          age: 0,
        },
        collider: {
          type: 'circle' as const,
          radius: 5,
          isTrigger: true,
          layer: 'player_bullet',
          mask: ['enemy'],
        },
        renderable: {
          visible: true,
          zIndex: 8,
          sprite: 'bullet_player',
          color: '#4FC3F7',
          alpha: 1,
          trailEffect: true,
          trailLength: 10,
        },
      },
    },
    [BulletType.ENEMY]: {
      components: {
        position: {
          ...position,
          width: 10,
          height: 20,
          rotation: 180, // Pointing downward
        },
        velocity: {
          ...velocity,
          maxSpeed: 400,
          acceleration: 0,
          friction: 0,
        },
        bullet: {
          type: BulletType.ENEMY,
          damage: 20,
          pierce: 1,
          currentPierce: 1,
          ownerId: ownerId || 'enemy',
          lifetime: 4.0,
          age: 0,
        },
        collider: {
          type: 'circle' as const,
          radius: 5,
          isTrigger: true,
          layer: 'enemy_bullet',
          mask: ['player'],
        },
        renderable: {
          visible: true,
          zIndex: 8,
          sprite: 'bullet_enemy',
          color: '#FF8A65',
          alpha: 1,
          trailEffect: true,
          trailLength: 8,
        },
      },
    },
    [BulletType.POWER_UP]: {
      components: {
        position: {
          ...position,
          width: 15,
          height: 15,
          rotation: 0,
        },
        velocity: {
          ...velocity,
          maxSpeed: 300,
          acceleration: 0,
          friction: 0,
        },
        bullet: {
          type: BulletType.POWER_UP,
          damage: 15,
          pierce: 3,
          currentPierce: 3,
          ownerId: ownerId || 'player',
          lifetime: 2.5,
          age: 0,
          homing: true,
          homingStrength: 0.5,
        },
        collider: {
          type: 'circle' as const,
          radius: 7,
          isTrigger: true,
          layer: 'player_bullet',
          mask: ['enemy'],
        },
        renderable: {
          visible: true,
          zIndex: 8,
          sprite: 'bullet_power',
          color: '#BA68C8',
          alpha: 1,
          trailEffect: true,
          trailLength: 15,
          glowEffect: true,
        },
      },
    },
  };

  const config = bulletConfigs[bulletType];
  bullet.components = config.components;

  return bullet;
};

/**
 * Creates a player bullet aimed at a target
 * @param playerPosition - Player's position
 * @param targetPosition - Target position to aim at
 * @param bulletType - Type of bullet (defaults to player)
 * @returns A bullet entity aimed at the target
 */
export const createAimedBullet = (
  playerPosition: Position,
  targetPosition: Position,
  bulletType: BulletType = BulletType.PLAYER
): GameEntity => {
  // Calculate direction to target
  const dx = targetPosition.x - playerPosition.x;
  const dy = targetPosition.y - playerPosition.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Normalize direction
  const directionX = dx / distance;
  const directionY = dy / distance;

  // Create bullet with velocity towards target
  const speed = bulletType === BulletType.POWER_UP ? 500 : 600;
  const velocity = {
    x: directionX * speed,
    y: directionY * speed,
    maxSpeed: speed,
    acceleration: 0,
    friction: 0,
  };

  return createBulletEntity(playerPosition, velocity, bulletType, 'player');
};

/**
 * Creates a spread of bullets (for multi-shot power-up)
 * @param position - Starting position
 * @param baseAngle - Base angle in degrees (0 = straight up)
 * @param spreadAngle - Total spread angle in degrees
 * @param bulletCount - Number of bullets in the spread
 * @returns Array of bullet entities
 */
export const createBulletSpread = (
  position: Position,
  baseAngle: number = 0,
  spreadAngle: number = 30,
  bulletCount: number = 3
): GameEntity[] => {
  const bullets: GameEntity[] = [];

  // Calculate angle between bullets
  const angleStep = spreadAngle / (bulletCount - 1);
  const startAngle = baseAngle - spreadAngle / 2;

  for (let i = 0; i < bulletCount; i++) {
    const angle = startAngle + angleStep * i;
    const angleRad = (angle * Math.PI) / 180;

    // Calculate velocity based on angle
    const speed = 600;
    const velocity = {
      x: Math.sin(angleRad) * speed,
      y: -Math.cos(angleRad) * speed, // Negative because up is negative Y
      maxSpeed: speed,
      acceleration: 0,
      friction: 0,
    };

    const bullet = createBulletEntity(position, velocity, BulletType.PLAYER, 'player');
    bullets.push(bullet);
  }

  return bullets;
};

/**
 * Creates a spiral bullet pattern (for boss attacks)
 * @param position - Starting position
 * @param angleOffset - Starting angle offset
 * @param bulletCount - Number of bullets in the spiral
 * @param spiralTightness - How tight the spiral is
 * @returns Array of bullet entities
 */
export const createSpiralBulletPattern = (
  position: Position,
  angleOffset: number = 0,
  bulletCount: number = 8,
  spiralTightness: number = 0.2
): GameEntity[] => {
  const bullets: GameEntity[] = [];

  for (let i = 0; i < bulletCount; i++) {
    const angle = angleOffset + (i * 2 * Math.PI) / bulletCount;
    const radius = 1 + spiralTightness * i;

    // Calculate velocity in spiral pattern
    const speed = 300;
    const velocity = {
      x: Math.cos(angle) * radius * speed,
      y: Math.sin(angle) * radius * speed,
      maxSpeed: speed,
      acceleration: 0,
      friction: 0,
    };

    const bullet = createBulletEntity(position, velocity, BulletType.ENEMY, 'boss');
    bullets.push(bullet);
  }

  return bullets;
};

/**
 * Updates bullet age and checks for expiration
 * @param bullet - Bullet entity to update
 * @param deltaTime - Time since last update in seconds
 * @returns Updated bullet entity, or null if bullet should be destroyed
 */
export const updateBulletAge = (bullet: GameEntity, deltaTime: number): GameEntity | null => {
  if (!bullet.components.bullet) return bullet;

  const bulletComp = bullet.components.bullet;
  const newAge = bulletComp.age + deltaTime;

  // Check if bullet has expired
  if (newAge >= bulletComp.lifetime) {
    return null; // Signal that bullet should be destroyed
  }

  return {
    ...bullet,
    components: {
      ...bullet.components,
      bullet: {
        ...bulletComp,
        age: newAge,
      },
    },
  };
};

/**
 * Applies homing behavior to a bullet
 * @param bullet - Bullet entity to update
 * @param targetPosition - Position to home towards
 * @param deltaTime - Time since last update in seconds
 * @returns Updated bullet entity with adjusted velocity
 */
export const applyBulletHoming = (
  bullet: GameEntity,
  targetPosition: Position,
  deltaTime: number
): GameEntity => {
  if (!bullet.components.bullet?.homing || !bullet.components.position || !bullet.components.velocity) {
    return bullet;
  }

  const bulletComp = bullet.components.bullet;
  const position = bullet.components.position;
  const velocity = bullet.components.velocity;

  // Calculate direction to target
  const dx = targetPosition.x - position.x;
  const dy = targetPosition.y - position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // If target is too far, don't home
  if (distance > 500) return bullet;

  // Normalize direction
  const directionX = dx / distance;
  const directionY = dy / distance;

  // Adjust velocity towards target
  const homingStrength = bulletComp.homingStrength || 0.5;
  const newVelocity = {
    ...velocity,
    x: velocity.x + directionX * homingStrength * deltaTime * 1000,
    y: velocity.y + directionY * homingStrength * deltaTime * 1000,
  };

  // Limit speed
  const speed = Math.sqrt(newVelocity.x * newVelocity.x + newVelocity.y * newVelocity.y);
  const maxSpeed = velocity.maxSpeed || 800;
  if (speed > maxSpeed) {
    const scale = maxSpeed / speed;
    newVelocity.x *= scale;
    newVelocity.y *= scale;
  }

  return {
    ...bullet,
    components: {
      ...bullet.components,
      velocity: newVelocity,
    },
  };
};

/**
 * Reduces bullet's pierce count (when it hits an enemy)
 * @param bullet - Bullet entity to update
 * @returns Updated bullet entity with reduced pierce, or null if pierce is exhausted
 */
export const reduceBulletPierce = (bullet: GameEntity): GameEntity | null => {
  if (!bullet.components.bullet) return bullet;

  const bulletComp = bullet.components.bullet;
  const newPierce = bulletComp.currentPierce - 1;

  if (newPierce <= 0) {
    return null; // Signal that bullet should be destroyed
  }

  return {
    ...bullet,
    components: {
      ...bullet.components,
      bullet: {
        ...bulletComp,
        currentPierce: newPierce,
      },
    },
  };
};

/**
 * Gets bullet damage
 * @param bullet - Bullet entity
 * @returns Damage value of the bullet
 */
export const getBulletDamage = (bullet: GameEntity): number => {
  return bullet.components.bullet?.damage || 0;
};

/**
 * Gets bullet owner ID
 * @param bullet - Bullet entity
 * @returns ID of the entity that fired the bullet
 */
export const getBulletOwnerId = (bullet: GameEntity): string => {
  return bullet.components.bullet?.ownerId || 'unknown';
};

/**
 * Gets bullet type
 * @param bullet - Bullet entity
 * @returns Type of bullet
 */
export const getBulletType = (bullet: GameEntity): BulletType => {
  return bullet.components.bullet?.type || BulletType.PLAYER;
};

/**
 * Checks if bullet is off screen
 * @param bullet - Bullet entity to check
 * @param screenWidth - Width of the game screen
 * @param screenHeight - Height of the game screen
 * @returns True if bullet is off screen
 */
export const isBulletOffScreen = (
  bullet: GameEntity,
  screenWidth: number,
  screenHeight: number
): boolean => {
  if (!bullet.components.position) return false;

  const position = bullet.components.position;
  const margin = 50; // Margin before considering bullet off screen

  return (
    position.x < -margin ||
    position.x > screenWidth + margin ||
    position.y < -margin ||
    position.y > screenHeight + margin
  );
};

/**
 * Creates a bullet with ricochet behavior
 * @param position - Starting position
 * @param velocity - Initial velocity
 * @param ricochetCount - Number of times bullet can ricochet
 * @returns A bullet entity with ricochet capability
 */
export const createRicochetBullet = (
  position: Position,
  velocity: Velocity,
  ricochetCount: number = 3
): GameEntity => {
  const bullet = createBulletEntity(position, velocity, BulletType.PLAYER, 'player');

  if (!bullet.components.bullet) return bullet;

  return {
    ...bullet,
    components: {
      ...bullet.components,
      bullet: {
        ...bullet.components.bullet,
        ricochet: true,
        ricochetCount,
        currentRicochet: ricochetCount,
      },
    },
  };
};

/**
 * Handles bullet ricochet off screen edges
 * @param bullet - Bullet entity
 * @param screenWidth - Width of the game screen
 * @param screenHeight - Height of the game screen
 * @returns Updated bullet entity with ricochet applied, or null if no ricochets left
 */
export const handleBulletRicochet = (
  bullet: GameEntity,
  screenWidth: number,
  screenHeight: number
): GameEntity | null => {
  if (!bullet.components.bullet?.ricochet || !bullet.components.position || !bullet.components.velocity) {
    return bullet;
  }

  const bulletComp = bullet.components.bullet;
  const position = bullet.components.position;
  const velocity = bullet.components.velocity;

  let newVelocity = { ...velocity };
  let ricocheted = false;

  // Check for screen edge collisions
  const margin = 10;
  if (position.x <= margin && velocity.x < 0) {
    // Left edge
    newVelocity.x = Math.abs(velocity.x);
    ricocheted = true;
  } else if (position.x >= screenWidth - margin && velocity.x > 0) {
    // Right edge
    newVelocity.x = -Math.abs(velocity.x);
    ricocheted = true;
  }

  if (position.y <= margin && velocity.y < 0) {
    // Top edge
    newVelocity.y = Math.abs(velocity.y);
    ricocheted = true;
  } else if (position.y >= screenHeight - margin && velocity.y > 0) {
    // Bottom edge
    newVelocity.y = -Math.abs(velocity.y);
    ricocheted = true;
  }

  if (ricocheted) {
    // Reduce ricochet count
    const currentRicochet = bulletComp.currentRicochet ?? bulletComp.ricochetCount ?? 0;
    const newRicochet = currentRicochet - 1;

    if (newRicochet <= 0) {
      return null; // No more ricochets, destroy bullet
    }

    return {
      ...bullet,
      components: {
        ...bullet.components,
        velocity: newVelocity,
        bullet: {
          ...bulletComp,
          currentRicochet: newRicochet,
        },
      },
    };
  }

  return bullet;
};