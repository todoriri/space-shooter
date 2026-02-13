// Particle System for Entity-Component-System architecture
// Handles visual effects like explosions, engine trails, and hit effects

import { GameEntity, EntityType, Position, Renderable } from '../../types';

// Particle types
export enum ParticleType {
  EXPLOSION = 'explosion',
  ENGINE_TRAIL = 'engine_trail',
  HIT_EFFECT = 'hit_effect',
  POWER_UP_GLOW = 'power_up_glow',
  BULLET_TRAIL = 'bullet_trail',
  SHIELD_EFFECT = 'shield_effect',
}

// ... (skipping ParticleConfig and ParticleEntity interfaces as they seem fine, or I can include them if needed context)

// System function that manages particles
export const ParticleSystem = (
  entities: Record<string, GameEntity>,
  { time, dispatch }: { time: { current: number; delta?: number }; dispatch: (event: any) => void }
) => {
  const deltaTime = Math.min(time.delta || 16, 100) / 1000; // Convert to seconds, default to 16ms if undefined

  // Update existing particles
  Object.keys(entities).forEach(id => {
    const entity = entities[id];

    // Check if entity is a particle
    if (entity.type === EntityType.PARTICLE || (entity as any).particleType) {
      updateParticle(entity as any, deltaTime, entities, id);
    }
  });

  return entities;
};

// ...

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
  }
};

// Create explosion effect
export const createExplosionEffect = (
  position: Position,
  size: number = 50,
  particleCount: number = 20
): ParticleEntity[] => {
  const particles: ParticleEntity[] = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 150;
    const lifetime = 0.5 + Math.random() * 1.0;

    const particle: ParticleEntity = {
      id: `explosion_particle_${Date.now()}_${i}`,
      type: 'particle' as EntityType,
      active: true,
      tags: ['particle', 'explosion'],
      particleType: ParticleType.EXPLOSION,
      age: 0,
      maxAge: lifetime,
      initialSize: 3 + Math.random() * 7,
      initialColor: '#FFD700',
      components: {
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
      },
    };

    // Add particle-specific properties
    (particle as any).fadeOut = true;
    (particle as any).gravity = true;

    particles.push(particle);
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

  return {
    id: `engine_trail_${Date.now()}`,
    type: 'particle' as EntityType,
    active: true,
    tags: ['particle', 'engine_trail'],
    particleType: ParticleType.ENGINE_TRAIL,
    age: 0,
    maxAge: 0.3,
    initialSize: 8,
    initialColor: '#4FC3F7',
    components: {
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
    },
  };
};

// Create hit effect
export const createHitEffect = (
  position: Position,
  color: string = '#FFFFFF'
): ParticleEntity => {
  return {
    id: `hit_effect_${Date.now()}`,
    type: 'particle' as EntityType,
    active: true,
    tags: ['particle', 'hit_effect'],
    particleType: ParticleType.HIT_EFFECT,
    age: 0,
    maxAge: 0.2,
    initialSize: 15,
    initialColor: color,
    components: {
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
    },
  };
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

  return {
    id: `powerup_glow_${Date.now()}`,
    type: 'particle' as EntityType,
    active: true,
    tags: ['particle', 'powerup_glow'],
    particleType: ParticleType.POWER_UP_GLOW,
    age: 0,
    maxAge: 1.5,
    initialSize: 30,
    initialColor: colors[powerUpType] || '#FFFFFF',
    components: {
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
    },
  };
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

  return {
    id: `bullet_trail_${Date.now()}`,
    type: 'particle' as EntityType,
    active: true,
    tags: ['particle', 'bullet_trail'],
    particleType: ParticleType.BULLET_TRAIL,
    age: 0,
    maxAge: 0.1,
    initialSize: 3,
    initialColor: color,
    components: {
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
    },
  };
};

// Create shield effect
export const createShieldEffect = (
  position: Position,
  radius: number = 25
): ParticleEntity => {
  return {
    id: `shield_effect_${Date.now()}`,
    type: 'particle' as EntityType,
    active: true,
    tags: ['particle', 'shield_effect'],
    particleType: ParticleType.SHIELD_EFFECT,
    age: 0,
    maxAge: 10, // Match shield duration
    initialSize: radius * 2,
    initialColor: '#00FFFF',
    components: {
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
    },
  };
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