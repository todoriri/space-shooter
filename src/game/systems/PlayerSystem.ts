import { Dimensions } from 'react-native';
import { GameEntity, EntityType, BulletType } from '../../types';
import { createBulletEntity } from '../entities/Bullet';
import { createBombEffect, createEngineTrailEffect } from './ParticleSystem';
import { checkCircleAABBCollision } from '../../utils/collision';

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
        time: { current: number; delta?: number };
        dispatch: (event: any) => void;
        input: InputState;
    }
) => {
    const currentTime = time.current;

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

    // 4. Handle Movement with Smoothing
    // Initialize targetPosition if missing
    if (!playerComp.targetPosition) {
        playerComp.targetPosition = { ...position };
    }

    // Apply input to TARGET position (instant response to input)
    if (input.move.x !== 0 || input.move.y !== 0) {
        playerComp.targetPosition.x += input.move.x;
        playerComp.targetPosition.y += input.move.y;

        // Reset input immediately
        input.move = { x: 0, y: 0 };
    }

    // Constrain TARGET position to screen bounds
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
    const pWidth = position.width || 50;
    const pHeight = position.height || 50;

    playerComp.targetPosition.x = Math.max(pWidth / 2, Math.min(SCREEN_WIDTH - pWidth / 2, playerComp.targetPosition.x));
    playerComp.targetPosition.y = Math.max(pHeight / 2, Math.min(SCREEN_HEIGHT - pHeight / 2, playerComp.targetPosition.y));

    // Smoothly interpolate CURRENT position towards TARGET position
    // Lerp factor: 0.2 gives good responsiveness with slight weight. 
    // Higher = snappier, Lower = smoother/laggy.
    const smoothingFactor = 0.6; // Increased from 0.2 for better agility per user feedback

    position.x += (playerComp.targetPosition.x - position.x) * smoothingFactor;
    position.y += (playerComp.targetPosition.y - position.y) * smoothingFactor;

    // Snap to target if very close to prevent micro-jitter
    if (Math.abs(playerComp.targetPosition.x - position.x) < 0.1) position.x = playerComp.targetPosition.x;
    if (Math.abs(playerComp.targetPosition.y - position.y) < 0.1) position.y = playerComp.targetPosition.y;

    // 5. Engine Trails (Visual Smoothing)
    const TRAIL_INTERVAL = 50; // ms
    if (!playerComp.lastTrailTime || currentTime - playerComp.lastTrailTime > TRAIL_INTERVAL) {
        playerComp.lastTrailTime = currentTime;

        // Offset trail to behind ship
        const trailPos = {
            x: position.x,
            y: position.y + (position.height || 50) / 2 + 5,
        };

        const trail = createEngineTrailEffect(trailPos);
        entities[trail.id] = trail;
    }

    // 2. Handle Shooting
    if (input.shooting) {
        const now = Date.now();
        // Check cooldown
        if (now - playerComp.lastShotTime >= playerComp.shootCooldown * 1000) {
            // Create bullets based on weapon level
            const weaponLevel = playerComp.weaponLevel || 1;
            const bulletSpeed = -600;
            const bulletY = position.y - (position.height || 0) / 2;

            // Helper to create a bullet
            const createBullet = (xOffset: number, angle: number = 0) => {
                const bulletStartPos = {
                    x: position.x + xOffset,
                    y: bulletY,
                    width: 10,
                    height: 10,
                    rotation: angle
                };

                const velocityX = angle !== 0 ? Math.sin(angle * (Math.PI / 180)) * 400 : 0;

                const bullet = createBulletEntity(
                    bulletStartPos,
                    { x: velocityX, y: bulletSpeed, maxSpeed: 800, acceleration: 0, friction: 0 },
                    BulletType.PLAYER,
                    player.id
                );

                entities[bullet.id] = bullet;
            };

            // Switch based on weapon level
            switch (weaponLevel) {
                case 1:
                    // Single shot
                    createBullet(0);
                    break;

                case 2:
                    // Double shot
                    createBullet(-10);
                    createBullet(10);
                    break;

                case 3:
                    // Spread shot (Tri-shot)
                    createBullet(0);       // Center
                    createBullet(-15, -15); // Left angled
                    createBullet(15, 15);   // Right angled
                    break;

                default:
                    // Fallback to max level behavior if somehow higher
                    createBullet(0);
                    createBullet(-15, -15);
                    createBullet(15, 15);
                    createBullet(-30, -30);
                    createBullet(30, 30);
                    break;
            }

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
        if (__DEV__) console.log('[PlayerSystem] Bomb input detected');
        const now = Date.now();
        const cooldown = (playerComp.bombCooldown || 20) * 1000;
        const timeSinceLast = now - (playerComp.lastBombTime || 0);

        if (__DEV__) console.log(`[PlayerSystem] Bomb cooldown check: ${timeSinceLast}ms / ${cooldown}ms`);

        if (timeSinceLast >= cooldown) {
            if (__DEV__) console.log('[PlayerSystem] Firing Bomb!');
            // Trigger Bomb
            playerComp.lastBombTime = now;

            // Create Bomb Entity (persistent area of effect)
            const bombId = `bomb_${now}`;
            // Use actual screen dimensions (captured at top of file, or passed in?)
            // Dimensions.get is available at module level.
            const { width: sWidth, height: sHeight } = Dimensions.get('window');
            const bombSize = sWidth * 0.8;

            // INSTANT RADIUS DAMAGE - Apply damage to all enemies within bomb radius immediately
            const bombCenterX = sWidth / 2;
            const bombCenterY = sHeight / 2;
            const bombRadius = bombSize / 2;

            // Find and damage all enemies within radius
            Object.values(entities).forEach(targetEntity => {
                if (targetEntity.type !== EntityType.ENEMY || !targetEntity.active) return;

                const enemyPos = targetEntity.components.position;
                const enemyHealth = targetEntity.components.health;
                const enemyComp = targetEntity.components.enemy;

                if (!enemyPos || !enemyHealth) return;

                // Calculate enemy center position
                const enemyCenterX = enemyPos.x;
                const enemyCenterY = enemyPos.y;
                const enemyWidth = enemyPos.width || 40;
                const enemyHeight = enemyPos.height || 40;

                // Check if enemy is within bomb radius using circle-to-AABB collision
                const isInRange = checkCircleAABBCollision(
                    bombCenterX,
                    bombCenterY,
                    bombRadius,
                    enemyCenterX - enemyWidth / 2,
                    enemyCenterY - enemyHeight / 2,
                    enemyWidth,
                    enemyHeight
                );

                if (isInRange) {
                    // Apply massive damage
                    enemyHealth.current = 0;

                    // Dispatch enemy destroyed event
                    dispatch({
                        type: 'enemyDestroyed',
                        data: {
                            position: { x: enemyCenterX, y: enemyCenterY },
                            enemyType: enemyComp?.type || 'unknown',
                            points: enemyComp?.scoreValue || 100,
                        },
                    });

                    // Remove enemy
                    delete entities[targetEntity.id];

                    // Add score to player
                    if (playerComp && enemyComp) {
                        playerComp.score += enemyComp.scoreValue || 100;
                    }
                }
            });

            // Create a purely visual bomb entity (no collision - damage already applied)
            entities[bombId] = {
                id: bombId,
                type: EntityType.BULLET,
                active: true,
                tags: ['bomb', 'visual_only'], // Mark as visual only - skip in collision
                components: {
                    position: {
                        x: (sWidth - bombSize) / 2,
                        y: (sHeight - bombSize) / 2,
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
                        damage: 0, // No damage - already applied via radius
                        pierce: 0,
                        currentPierce: 0,
                        ownerId: player.id,
                        lifetime: 3.0, // 3 seconds for visual effect
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
                { x: (sWidth - bombSize) / 2, y: (sHeight - bombSize) / 2 },
                3000,
                { width: sWidth, height: sHeight }
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
