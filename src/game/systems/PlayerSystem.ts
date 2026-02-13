import { GameEntity, EntityType, BulletType } from '../../types';
import { createBulletEntity } from '../entities/Bullet';

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
        // TODO: Implement bomb logic or dispatch event
        if (!playerComp.activePowerUps?.some(p => p.type === 'bomb')) {
            // Check if has bomb charge or powerup
        }

        dispatch({ type: 'playerBomb' });
        input.bomb = false; // Bomb is single trigger
    }

    return entities;
};
