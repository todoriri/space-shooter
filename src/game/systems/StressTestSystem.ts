import { GameEntity, EntityType, BulletType } from '../../types';
import { createExplosionEffect } from './ParticleSystem';
import { createBulletEntity } from '../entities/Bullet';

// Global flag to toggle stress test
export const StressTestSystem = (
    entities: Record<string, GameEntity>,
    { time, screen, enabled }: { time: { delta: number }, screen: { width: number, height: number }, enabled: boolean }
) => {
    if (!enabled) return entities;

    const { width, height } = screen;
    // console.log(`[StressTest] Active. Screen: ${width}x${height}`); // Commented out to reduce noise, enable if needed

    // We operate directly on entities for performance in stress test, 
    // though typically we might want to return a new object.
    // react-native-game-engine handles the return value as the new state.

    // Spawn random explosion (particles)
    if (Math.random() < 0.5) { // 50% chance per frame
        const x = Math.random() * width;
        const y = Math.random() * height;

        const particles = createExplosionEffect({ x, y, width: 0, height: 0 }, 50, 10); // Position needs width/height technically but ParticleSystem ignores it for origin

        particles.forEach(p => {
            entities[p.id] = p;
        });
    }

    // Spawn random bullets
    if (Math.random() < 0.2) { // 20% chance per frame
        const x = Math.random() * width;
        const y = Math.random() * height;

        const velocity = {
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
            maxSpeed: 400,
            acceleration: 0,
            friction: 0
        };

        const bullet = createBulletEntity(
            { x, y, width: 10, height: 10 },
            velocity,
            BulletType.ENEMY,
            'stress_test'
        );

        entities[bullet.id] = bullet;
    }

    return entities;
};
