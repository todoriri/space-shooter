// Particle System for Entity-Component-System architecture
// Handles visual effects like explosions, engine trails, and hit effects

import { GameEntity, EntityType, Position, Renderable } from '../../types';
import { EntityPool } from '../../utils/EntityPool';

// Performance configuration
const MAX_ACTIVE_PARTICLES = 30; // Cap to maintain 60 FPS
let activeParticleCount = 0;

// Particle types
export enum ParticleType {
  EXPLOSION = 'explosion',
  ENGINE_TRAIL = 'engine_trail',
  HIT_EFFECT = 'hit_effect',
  POWER_UP_GLOW = 'power_up_glow',
  BULLET_TRAIL = 'bullet_trail',
  SHIELD_EFFECT = 'shield_effect',
  BOMB_EXPLOSION = 'bomb_explosion',
}

// Particle configuration for creation
export interface ParticleConfig {
  type: ParticleType;
  duration?: number;
  size?: number;
  color?: string;
  speed?: number;
  spread?: number;
  count?: number;
}

// Particle entity extension
export interface ParticleEntity extends GameEntity {
  particleType: ParticleType;
  age: number;
  maxAge: number;
  initialSize?: number;
  initialColor?: string;
}

// Particle Pool
const particlePool = new EntityPool<ParticleEntity>(
  () => ({
    id: `particle_${Date.now()}_${Math.random()}`,
    type: EntityType.PARTICLE,
    active: true,
    tags: ['particle'],
    particleType: ParticleType.EXPLOSION, // Default
    age: 0,
    maxAge: 1,
    components: {}
  }),
  (entity) => {
    entity.active = true;
    entity.tags = ['particle'];
    entity.age = 0;
    // Clear dynamic properties if they exist
    const e = entity as any;
    if (e.fadeOut) delete e.fadeOut;
    if (e.gravity) delete e.gravity;
    return entity;
  },
  100, // Initial size
  500 // Max size
);

// Helper to release particle
const releaseParticle = (particle: ParticleEntity) => {
  particle.active = false;
  activeParticleCount = Math.max(0, activeParticleCount - 1);
  particlePool.release(particle);
};

// Check if we can create more particles
const canCreateParticle = (): boolean => {
  return activeParticleCount < MAX_ACTIVE_PARTICLES;
};

// Helper to get current particle count (for debugging/monitoring)
export const getActiveParticleCount = (): number => activeParticleCount;



// System function that manages particles
export const ParticleSystem = (
  entities: Record<string, GameEntity>,
  { time, dispatch, events }: { time: { current: number; delta?: number }; dispatch: (event: any) => void; events?: any[] }
) => {
  const deltaTime = Math.min(time.delta || 16, 100) / 1000; // Convert to seconds, default to 16ms if undefined

  // Process new events to create particles
  if (events && events.length > 0) {
    events.forEach(event => {
      // Create particles based on event
      // handleParticleEvent expects immutability but returns new object
      // usage: entities = handleParticleEvent(event, entities)
      // Note: This replaces the entities reference locally for this function scope
      entities = handleParticleEvent(event, entities);
    });
  }

  // Update existing particles
  Object.keys(entities).forEach(id => {
    const entity = entities[id];

    // Check if entity exists and is a particle
    if (!entity) return;

    if (entity.type === EntityType.PARTICLE || (entity as any).particleType) {
      updateParticle(entity as any, deltaTime, entities, id);
    } else if (entity.type === EntityType.FLOATING_TEXT) {
      // Update floating text logic here or delegate
      updateFloatingText(entity, deltaTime, entities, id);
    }
  });

  return entities;
};

// Update a single particle
const updateParticle = (
  particle: ParticleEntity,
  deltaTime: number,
  entities: Record<string, GameEntity>,
  id: string
) => {
  // Update age
  particle.age += deltaTime;

  // Remove if too old
  if (particle.age >= particle.maxAge) {
    // Release to pool and remove from entities
    releaseParticle(particle);
    delete entities[id];
    return;
  }

  // Update physics
  const position = particle.components.position;
  const velocity = particle.components.velocity;
  const acceleration = particle.components.acceleration;

  if (position && velocity) {
    // Apply acceleration
    if (acceleration) {
      velocity.x += acceleration.x * deltaTime;
      velocity.y += acceleration.y * deltaTime;
    }

    // Apply velocity
    position.x += velocity.x * deltaTime;
    position.y += velocity.y * deltaTime;

    // Apply rotation based on velocity or spin
    if (position.rotation !== undefined) {
      // Optional: rotate particle
    }
  }

  // Update appearance
  updateParticleAppearance(particle, deltaTime);
};

// Update floating text
const updateFloatingText = (
  entity: GameEntity,
  deltaTime: number,
  entities: Record<string, GameEntity>,
  id: string
) => {
  const ft = entity.components.floatingText;
  const pos = entity.components.position;
  const vel = entity.components.velocity;
  const render = entity.components.renderable;

  if (!ft || !pos || !vel || !render) return;

  // Update age
  ft.age += deltaTime;
  if (ft.age >= ft.lifetime) {
    delete entities[id];
    return;
  }

  // Float up
  pos.y += vel.y * deltaTime;

  // Fade out
  const ageRatio = ft.age / ft.lifetime;
  ft.opacity = 1 - Math.pow(ageRatio, 3); // Cubic ease out
  render.alpha = ft.opacity;
};

// Update particle appearance (size, color, opacity)
const updateParticleAppearance = (particle: ParticleEntity, deltaTime: number) => {
  const renderable = particle.components.renderable;
  const position = particle.components.position;

  if (!renderable) return;

  const ageRatio = particle.age / particle.maxAge;

  // Handle fade out
  if ((particle as any).fadeOut) {
    renderable.alpha = 1 - ageRatio;
  }

  // Handle size change
  if (particle.initialSize && position) {
    const sizeMultiplier = 1 - ageRatio * 0.5; // Shrink to 50% of original size
    if (position.width && position.height) {
      position.width = particle.initialSize * sizeMultiplier;
      position.height = particle.initialSize * sizeMultiplier;
    }
  }

  // Handle color change for certain particle types
  switch (particle.particleType) {
    case ParticleType.EXPLOSION:
      // Explosion particles change from yellow to red to black
      if (ageRatio < 0.33) {
        renderable.color = '#FFD700'; // Gold
      } else if (ageRatio < 0.66) {
        renderable.color = '#FF4500'; // OrangeRed
      } else {
        renderable.color = '#8B0000'; // DarkRed
      }
      break;

    case ParticleType.ENGINE_TRAIL:
      // Engine trail fades from blue to transparent
      renderable.alpha = 0.7 * (1 - ageRatio);
      break;

    case ParticleType.HIT_EFFECT:
      // Hit effect pulses white
      const pulse = Math.sin(ageRatio * Math.PI * 10) * 0.5 + 0.5;
      renderable.alpha = 0.8 * pulse;
      break;

    case ParticleType.BOMB_EXPLOSION:
      // Bomb explosion: Expand massive shockwave, fade out slowly
      // Color shift: White -> Yellow -> Orange -> Red -> Fade
      if (ageRatio < 0.1) {
        renderable.color = '#FFFFFF'; // Flash white
        renderable.alpha = 1;
      } else if (ageRatio < 0.3) {
        renderable.color = '#FFFF00'; // Yellow
        renderable.alpha = 0.9;
      } else if (ageRatio < 0.6) {
        renderable.color = '#FF4500'; // Orange Red
        renderable.alpha = 0.7;
      } else {
        renderable.color = '#8B0000'; // Dark Red
        renderable.alpha = 0.5 * (1 - ageRatio);
      }

      // Massive expansion
      if (position && position.width && position.height && particle.initialSize) {
        // Expand to 3x initial size over lifetime
        const scale = 1 + ageRatio * 2;
        position.width = particle.initialSize * scale;
        position.height = particle.initialSize * scale;
      }
      break;
  }
};

// Create explosion effect
export const createExplosionEffect = (
  position: Position,
  size: number = 50,
  particleCount: number = 10 // Reduced from 20 for performance
): ParticleEntity[] => {
  const particles: ParticleEntity[] = [];

  // Limit particles based on current count
  const availableSlots = MAX_ACTIVE_PARTICLES - activeParticleCount;
  const actualCount = Math.min(particleCount, availableSlots, 10); // Max 10 per explosion

  for (let i = 0; i < actualCount; i++) {
    if (!canCreateParticle()) break;
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 150;
    const lifetime = 0.5 + Math.random() * 1.0;

    const particle = particlePool.acquire();
    particle.id = `explosion_particle_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`;
    particle.type = EntityType.PARTICLE;
    particle.active = true;
    particle.tags = ['particle', 'explosion'];
    particle.particleType = ParticleType.EXPLOSION;
    particle.maxAge = lifetime;
    particle.initialSize = 3 + Math.random() * 7;
    particle.initialColor = '#FFD700';

    particle.components = {
      position: {
        x: position.x + (Math.random() - 0.5) * size * 0.5,
        y: position.y + (Math.random() - 0.5) * size * 0.5,
        width: 3 + Math.random() * 7,
        height: 3 + Math.random() * 7,
      },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      acceleration: {
        x: 0,
        y: 98, // Gravity
      },
      renderable: {
        visible: true,
        zIndex: 10,
        color: '#FFD700',
        alpha: 1,
        glowEffect: true,
      },
    };

    // Add particle-specific properties
    (particle as any).fadeOut = true;
    (particle as any).gravity = true;

    activeParticleCount++;
    particles.push(particle);
  }

  return particles;
};

// Create bomb effect (massive screen-clearing explosion)
export const createBombEffect = (
  position: Position,
  duration: number = 3000,
  screenSize: { width: number, height: number }
): ParticleEntity[] => {
  // 1. The main blast wave
  const particle = particlePool.acquire();
  particle.id = `bomb_blast_${Date.now()}`;
  particle.type = EntityType.PARTICLE;
  particle.active = true;
  particle.tags = ['particle', 'bomb_blast'];
  particle.particleType = ParticleType.BOMB_EXPLOSION;
  particle.maxAge = duration / 1000;
  particle.initialSize = screenSize.width * 0.8;
  particle.initialColor = '#FFFFFF';

  particle.components = {
    position: {
      x: screenSize.width / 2, // Center of screen
      y: screenSize.height / 2,
      width: screenSize.width * 0.8,
      height: screenSize.width * 0.8, // Circular/Square aspect
    },
    renderable: {
      visible: true,
      zIndex: 20, // Top layer
      color: '#FFFFFF',
      alpha: 1,
      glowEffect: true,
      pulseEffect: true,
      pulseSpeed: 10,
    },
  };

  const blastParams = particle;
  activeParticleCount++;

  const particles = [blastParams];

  // 2. Secondary Shockwave (faster, smaller)
  const innerShockwave = particlePool.acquire();
  innerShockwave.id = `bomb_shockwave_${Date.now()}`;
  innerShockwave.type = EntityType.PARTICLE;
  innerShockwave.active = true;
  innerShockwave.tags = ['particle', 'bomb_shockwave'];
  innerShockwave.particleType = ParticleType.BOMB_EXPLOSION; // Reuse behavior but different params
  innerShockwave.maxAge = duration / 1500; // Faster
  innerShockwave.initialSize = screenSize.width * 0.4;
  innerShockwave.initialColor = '#FFFF00';
  activeParticleCount++;
  innerShockwave.components = {
    position: {
      x: screenSize.width / 2,
      y: screenSize.height / 2,
      width: screenSize.width * 0.4,
      height: screenSize.width * 0.4,
    },
    renderable: {
      visible: true,
      zIndex: 21,
      color: '#FFFF00',
      alpha: 0.8,
      glowEffect: true,
    }
  };
  particles.push(innerShockwave);

  // 3. Debris particles (reduced from 16 to 8 for performance)
  const debrisCount = 8;
  for (let i = 0; i < debrisCount; i++) {
    const angle = (Math.PI * 2 * i) / debrisCount;
    const debris = particlePool.acquire();
    debris.id = `bomb_debris_${Date.now()}_${i}`;
    debris.type = EntityType.PARTICLE;
    debris.active = true;
    debris.tags = ['particle', 'debris'];
    debris.particleType = ParticleType.EXPLOSION; // Reuse explosion behavior
    debris.maxAge = 1.0;
    debris.initialSize = 10;
    debris.initialColor = '#FFFFFF';

    debris.components = {
      position: {
        x: screenSize.width / 2,
        y: screenSize.height / 2,
        width: 10,
        height: 10,
      },
      velocity: {
        x: Math.cos(angle) * 300,
        y: Math.sin(angle) * 300,
      },
      renderable: {
        visible: true,
        zIndex: 22,
        color: '#FFFFFF',
        alpha: 1,
        glowEffect: true,
      }
    };
    // Custom fade behavior
    (debris as any).fadeOut = true;
    activeParticleCount++;
    particles.push(debris);
  }

  return particles;
};

// Create engine trail effect
export const createEngineTrailEffect = (
  position: Position,
  direction: { x: number; y: number } = { x: 0, y: 1 }
): ParticleEntity => {
  const trailLength = 20;
  const trailOffset = 15;

  const particle = particlePool.acquire();
  particle.id = `engine_trail_${Date.now()}`;
  particle.active = true;
  particle.tags = ['particle', 'engine_trail'];
  particle.particleType = ParticleType.ENGINE_TRAIL;
  particle.maxAge = 0.3;
  particle.initialSize = 8;
  particle.initialColor = '#4FC3F7';

  particle.components = {
    position: {
      x: position.x - direction.x * trailOffset,
      y: position.y - direction.y * trailOffset,
      width: 8,
      height: trailLength,
      rotation: Math.atan2(direction.y, direction.x) * (180 / Math.PI) - 90,
    },
    velocity: {
      x: -direction.x * 50,
      y: -direction.y * 50,
    },
    renderable: {
      visible: true,
      zIndex: 1,
      color: '#4FC3F7',
      alpha: 0.7,
      glowEffect: true,
    },
  };
  return particle;
};

// Create hit effect
export const createHitEffect = (
  position: Position,
  color: string = '#FFFFFF'
): ParticleEntity => {
  const particle = particlePool.acquire();
  particle.id = `hit_effect_${Date.now()}`;
  particle.active = true;
  particle.tags = ['particle', 'hit_effect'];
  particle.particleType = ParticleType.HIT_EFFECT;
  particle.maxAge = 0.2;
  particle.initialSize = 15;
  particle.initialColor = color;

  particle.components = {
    position: {
      x: position.x,
      y: position.y,
      width: 15,
      height: 15,
    },
    renderable: {
      visible: true,
      zIndex: 15,
      color: color,
      alpha: 0.8,
      glowEffect: true,
      pulseEffect: true,
      pulseSpeed: 20,
    },
  };
  return particle;
};

// Create power-up glow effect
export const createPowerUpGlowEffect = (
  position: Position,
  powerUpType: string
): ParticleEntity => {
  const colors: Record<string, string> = {
    shield: '#00FFFF',
    rapidFire: '#FFD700',
    multiShot: '#FF69B4',
    bomb: '#FF4500',
    health: '#00FF00',
    score: '#9370DB',
  };

  const particle = particlePool.acquire();
  particle.id = `powerup_glow_${Date.now()}`;
  particle.active = true;
  particle.tags = ['particle', 'powerup_glow'];
  particle.particleType = ParticleType.POWER_UP_GLOW;
  particle.maxAge = 1.5;
  particle.initialSize = 30;
  particle.initialColor = colors[powerUpType] || '#FFFFFF';

  particle.components = {
    position: {
      x: position.x,
      y: position.y,
      width: 30,
      height: 30,
    },
    renderable: {
      visible: true,
      zIndex: 8,
      color: colors[powerUpType] || '#FFFFFF',
      alpha: 0.6,
      glowEffect: true,
      pulseEffect: true,
      pulseSpeed: 2,
    },
  };
  return particle;
};

// Create bullet trail effect
export const createBulletTrailEffect = (
  startPosition: Position,
  endPosition: Position,
  color: string = '#FFFFFF'
): ParticleEntity => {
  const dx = endPosition.x - startPosition.x;
  const dy = endPosition.y - startPosition.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  const particle = particlePool.acquire();
  particle.id = `bullet_trail_${Date.now()}`;
  particle.active = true;
  particle.tags = ['particle', 'bullet_trail'];
  particle.particleType = ParticleType.BULLET_TRAIL;
  particle.maxAge = 0.1;
  particle.initialSize = 3;
  particle.initialColor = color;

  particle.components = {
    position: {
      x: (startPosition.x + endPosition.x) / 2,
      y: (startPosition.y + endPosition.y) / 2,
      width: length,
      height: 3,
      rotation: angle,
    },
    renderable: {
      visible: true,
      zIndex: 5,
      color: color,
      alpha: 0.5,
      glowEffect: true,
    },
  };
  return particle;
};

// Create shield effect
export const createShieldEffect = (
  position: Position,
  radius: number = 25
): ParticleEntity => {
  const particle = particlePool.acquire();
  particle.id = `shield_effect_${Date.now()}`;
  particle.active = true;
  particle.tags = ['particle', 'shield_effect'];
  particle.particleType = ParticleType.SHIELD_EFFECT;
  particle.maxAge = 10;
  particle.initialSize = radius * 2;
  particle.initialColor = '#00FFFF';

  particle.components = {
    position: {
      x: position.x,
      y: position.y,
      width: radius * 2,
      height: radius * 2,
    },
    renderable: {
      visible: true,
      zIndex: 3,
      color: '#00FFFF',
      alpha: 0.3,
      glowEffect: true,
      pulseEffect: true,
      pulseSpeed: 1,
    },
  };
  return particle;
};

// Add particles to entities
export const addParticlesToEntities = (
  particles: ParticleEntity[],
  entities: Record<string, GameEntity>
): Record<string, GameEntity> => {
  const updatedEntities = { ...entities };

  particles.forEach(particle => {
    updatedEntities[particle.id] = particle;
  });

  return updatedEntities;
};

// Create floating text effect
export const createFloatingText = (
  position: Position,
  text: string,
  color: string = '#FFFFFF',
  size: number = 20,
  duration: number = 1.0
): GameEntity => {
  const entityId = `floating_text_${Date.now()}_${Math.random()}`;
  return {
    id: entityId,
    type: EntityType.FLOATING_TEXT,
    active: true,
    tags: ['floating_text'],
    components: {
      position: {
        x: position.x,
        y: position.y,
        width: size * text.length * 0.6,
        height: size,
        rotation: 0,
      },
      velocity: {
        x: 0,
        y: -50, // Float up
      },
      renderable: {
        visible: true,
        zIndex: 20,
        color: color,
        alpha: 1,
      },
      floatingText: {
        text: text,
        color: color,
        size: size,
        lifetime: duration,
        age: 0,
        opacity: 1,
      },
    },
  };
};

// Handle particle events from game events
export const handleParticleEvent = (
  event: any,
  entities: Record<string, GameEntity>
): Record<string, GameEntity> => {
  let updatedEntities = { ...entities };

  if (!event || !event.type) return updatedEntities;

  switch (event.type) {
    case 'enemyDestroyed':
      if (event.data && event.data.position) {
        const explosionParticles = createExplosionEffect(
          event.data.position,
          event.data.enemyType === 'boss' ? 100 : 50,
          event.data.enemyType === 'boss' ? 50 : 20
        );
        updatedEntities = addParticlesToEntities(explosionParticles, updatedEntities);
      }
      break;

    case 'playerHit':
      if (event.data && event.data.position) {
        const hitEffect = createHitEffect(event.data.position, '#FF0000');
        updatedEntities = addParticlesToEntities([hitEffect], updatedEntities);
      }
      break;

    case 'powerUpCollect':
      if (event.data && event.data.position && event.data.powerUpType) {
        const glowEffect = createPowerUpGlowEffect(event.data.position, event.data.powerUpType);
        updatedEntities = addParticlesToEntities([glowEffect], updatedEntities);
      }
      break;

    case 'playerShoot':
      if (event.data && event.data.position) {
        // Create bullet trail effect
        const trailStart = { ...event.data.position };
        const trailEnd = { ...event.data.position, y: event.data.position.y - 50 };
        const bulletTrail = createBulletTrailEffect(trailStart, trailEnd, '#4FC3F7');
        updatedEntities = addParticlesToEntities([bulletTrail], updatedEntities);
      }
      break;

    case 'powerUpActivated':
      if (event.data && event.data.powerUpType === 'shield') {
        // Find player position
        const player = Object.values(updatedEntities).find(e => e.type === EntityType.PLAYER);
        if (player && player.components.position) {
          const shieldEffect = createShieldEffect(player.components.position);
          updatedEntities = addParticlesToEntities([shieldEffect], updatedEntities);
        }
      }
      break;
  }

  return updatedEntities;
};