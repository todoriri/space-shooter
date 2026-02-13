import { GameEntity, EntityType, BulletType } from '../../types';
import { createBulletEntity } from '../entities/Bullet';
import { createBombEffect } from './ParticleSystem';

// Input state interface
export interface InputState {
    move: { x: number; y: number };
    shooting: boolean;
    bomb: boolean;
}

// System function that handles player input and state
export const PlayerSystem = (
    entities: Record<string, GameEntity>,
    { time, dispatch, input }: {
        time: { current: number };
        dispatch: (event: any) => void;
        input: InputState;
    }
) => {
    const currentTime = time.current;
    const deltaTime = 16.67; // Approx 60fps frame time in ms since RNGE might not pass delta to systems consistently

    // Find player entity
    const playerId = Object.keys(entities).find(id => entities[id].type === EntityType.PLAYER);
    const player = playerId ? entities[playerId] : null;

    if (!player || !player.components.player || !player.components.position) {
        return entities;
    }

    const playerComp = player.components.player;
    const position = player.components.position;
    const health = player.components.health;

    // Handle invulnerability timer reset
    if (health?.invulnerable) {
        if (!health.invulnerableTimer || currentTime > health.invulnerableTimer) {
            health.invulnerable = false;
            health.invulnerableTimer = undefined;
        }
    }

    // 1. Handle Movement
    if (input.move.x !== 0 || input.move.y !== 0) {
        // Update position based on input (assuming input.move is delta or velocity factor)
        // Here we assume standard normalized input vector scaled by speed
        // But TouchControls usually gives a delta.
        // Let's assume input.move IS the delta from the joystick

        // Apply movement (simple direct translation for now, or velocity based)
        // If using velocity component:
        if (player.components.velocity) {
            // Logic would be here, but for now getting simple position update
            // We'll update position directly for responsiveness with TouchControls
            position.x += input.move.x;
            position.y += input.move.y;

            // Boundary checks (keep player on screen)
            // Hardcoded screen limits for now or passed in checks
            const SCREEN_WIDTH = 400; // Approximate
            const SCREEN_HEIGHT = 800; // Approximate

            position.x = Math.max(20, Math.min(SCREEN_WIDTH - 20, position.x));
            position.y = Math.max(50, Math.min(SCREEN_HEIGHT - 50, position.y));

            // Reset move input after processing (if it's a delta that accumulates)
            // But TouchControls usually sends continuous stream. 
            // We will rely on GameEngine to reset it or keep updated.
        }

        // Reset input move if it's treated as a per-frame delta
        input.move = { x: 0, y: 0 };
    }

    // 2. Handle Shooting
    if (input.shooting) {
        const now = Date.now();
        // Check cooldown
        if (now - playerComp.lastShotTime >= playerComp.shootCooldown * 1000) {
            // Create bullet
            // We need to return new entities object with bullet added
            // Position is top of player
            const bulletStartPos = {
                x: position.x,
                y: position.y - (position.height || 0) / 2,
                width: 10,
                height: 10,
                rotation: 0
            };

            const bullet = createBulletEntity(
                bulletStartPos,
                { x: 0, y: -600, maxSpeed: 800, acceleration: 0, friction: 0 },
                BulletType.PLAYER, // 'player' bullet type
                player.id
            );

            entities[bullet.id] = bullet;

            // Update cooldown
            playerComp.lastShotTime = now;

            // Dispatch shoot event for sound/FX
            dispatch({
                type: 'playerShoot',
                data: { position: { x: position.x, y: position.y } }
            });

            // Consume shoot input?
            // If holding down, we want continuous fire. 
            // If we don't reset, it shoots every frame allowed by cooldown.
            // This is preferred for space shooter.
        }
    }

    // 3. Handle Bomb
    if (input.bomb) {
        console.log('[PlayerSystem] Bomb input detected');
        const now = Date.now();
        const cooldown = (playerComp.bombCooldown || 20) * 1000;
        const timeSinceLast = now - (playerComp.lastBombTime || 0);

        console.log(`[PlayerSystem] Bomb cooldown check: ${timeSinceLast}ms / ${cooldown}ms`);

        if (timeSinceLast >= cooldown) {
            console.log('[PlayerSystem] Firing Bomb!');
            // Trigger Bomb
            playerComp.lastBombTime = now;

            // Create Bomb Entity (persistent area of effect)
            const bombId = `bomb_${now}`;
            const screenWidth = 400;
            const screenHeight = 800;
            const bombSize = screenWidth * 0.8;

            entities[bombId] = {
                id: bombId,
                type: EntityType.BULLET, // Treat as a massive bullet
                active: true,
                tags: ['bomb', 'player_bullet'],
                components: {
                    position: {
                        x: (screenWidth - bombSize) / 2, // Center horizontally
                        y: (screenHeight - bombSize) / 2, // Center vertically
                        width: bombSize,
                        height: bombSize,
                        rotation: 0
                    },
                    velocity: {
                        x: 0,
                        y: 0
                    },
                    bullet: {
                        type: BulletType.PLAYER,
                        damage: 1000, // Massive damage
                        pierce: 9999, // Infinite pierce
                        currentPierce: 9999,
                        ownerId: player.id,
                        lifetime: 3000, // 3 seconds
                        age: 0
                    },
                    renderable: {
                        visible: false, // Visuals handled by ParticleSystem
                        zIndex: 10,
                        color: '#FFFFFF',
                        alpha: 0
                    }
                }
            };

            // DIRECTLY ADD BOMB PARTICLES
            // This prevents needing to round-trip through GameEngine and setEntities
            const bombParticles = createBombEffect(
                { x: (screenWidth - bombSize) / 2, y: (screenHeight - bombSize) / 2 },
                3000,
                { width: screenWidth, height: screenHeight }
            );

            bombParticles.forEach(p => {
                entities[p.id] = p;
            });

            dispatch({
                type: 'playerBomb',
                data: { position: { x: position.x, y: position.y } }
            });
        }

        input.bomb = false; // Reset input triggers
    }

    return entities;
};
