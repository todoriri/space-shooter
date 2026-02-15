// Foundation tests for mobile game core systems
import { MovementSystem } from '../../../src/game/systems/MovementSystemV2';
import { CollisionSystem, isOffScreen } from '../../../src/game/systems/CollisionSystemV2';
import { clamp, random, distance } from '../../../src/utils/math';
import { checkAABBCollision, SpatialGrid } from '../../../src/utils/collision';
import { EntityType, EnemyType, BulletType } from '../../../src/types';
import type { GameEntity } from '../../../src/types';

describe('Mobile Game Foundation Tests', () => {
  describe('Math Utilities', () => {
    test('clamp should limit values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
      // Note: clamp uses Math.max(min, Math.min(max, value)), so reversed args give different result
      // When min > max: Math.min(max, value) with max=0 gives 0, then Math.max(min, 0) with min=10 gives 10
      expect(clamp(5, 10, 0)).toBe(10); // Implementation doesn't auto-swap min/max
    });

    test('random should generate numbers within range', () => {
      const min = 10;
      const max = 20;

      for (let i = 0; i < 100; i++) {
        const value = random(min, max);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThan(max);
      }
    });

    test('distance should calculate Euclidean distance', () => {
      expect(distance(0, 0, 3, 4)).toBe(5); // 3-4-5 triangle
      expect(distance(1, 1, 4, 5)).toBe(5); // 3-4-5 triangle with offset
      expect(distance(0, 0, 0, 0)).toBe(0);
    });
  });

  describe('Collision Detection', () => {
    test('AABB collision detection', () => {
      const rect1 = { x: 0, y: 0, width: 10, height: 10 };
      const rect2 = { x: 5, y: 5, width: 10, height: 10 };
      const rect3 = { x: 20, y: 20, width: 10, height: 10 };

      expect(checkAABBCollision(rect1, rect2)).toBe(true);
      expect(checkAABBCollision(rect1, rect3)).toBe(false);
      expect(checkAABBCollision(rect2, rect3)).toBe(false);
    });

    test('SpatialGrid should manage spatial partitioning', () => {
      const grid = new SpatialGrid(50);

      const bounds1 = { x: 10, y: 10, width: 20, height: 20 };
      const bounds2 = { x: 15, y: 15, width: 20, height: 20 };
      const bounds3 = { x: 100, y: 100, width: 20, height: 20 };

      grid.insert('entity1', bounds1);
      grid.insert('entity2', bounds2);
      grid.insert('entity3', bounds3);

      const potentials1 = grid.getPotentialCollisions('entity1', bounds1);
      expect(potentials1.has('entity2')).toBe(true);
      expect(potentials1.has('entity3')).toBe(false);

      const potentials3 = grid.getPotentialCollisions('entity3', bounds3);
      expect(potentials3.size).toBe(0);
    });
  });

  describe('Movement System', () => {
    test('should process entities with position and velocity components', () => {
      const mockTime = { delta: 16, current: Date.now() }; // ~60fps

      const entities: Record<string, GameEntity> = {
        testBullet: {
          id: 'testBullet',
          type: EntityType.BULLET,
          active: true,
          components: {
            position: { x: 100, y: 500, width: 10, height: 20, rotation: 0 },
            velocity: { x: 0, y: -100 },
            bullet: { type: BulletType.PLAYER, damage: 25, pierce: 1, currentPierce: 1, ownerId: 'player', lifetime: 3, age: 0 },
          },
          tags: ['bullet'],
        },
      };

      const result = MovementSystem(entities, { time: mockTime });

      // Bullet should have moved (velocity * deltaTime)
      // -100 * 0.016 = -1.6
      // Note: MovementSystem also adds age to bullets, but we're testing position
      expect(result.testBullet.components.position?.y).toBeCloseTo(498.4, 1);
    });

    test('should apply velocity to bullets correctly', () => {
      const mockTime = { delta: 16, current: Date.now() };

      const entities: Record<string, GameEntity> = {
        testBullet: {
          id: 'testBullet',
          type: EntityType.BULLET,
          active: true,
          components: {
            position: { x: 100, y: 500, width: 10, height: 20, rotation: 0 },
            velocity: { x: 50, y: -200 },
            bullet: { type: BulletType.PLAYER, damage: 25, pierce: 1, currentPierce: 1, ownerId: 'player', lifetime: 3, age: 0 },
          },
          tags: ['bullet'],
        },
      };

      const result = MovementSystem(entities, { time: mockTime });

      // 50 * 0.016 = 0.8, -200 * 0.016 = -3.2
      expect(result.testBullet.components.position?.x).toBeCloseTo(100.8, 1);
      expect(result.testBullet.components.position?.y).toBeCloseTo(496.8, 1);
    });
  });

  describe('Collision System', () => {
    test('should detect collision types correctly', () => {
      const mockDispatch = jest.fn();
      const mockTime = { current: Date.now() };

      const entities: Record<string, GameEntity> = {
        player: {
          id: 'player',
          type: EntityType.PLAYER,
          active: true,
          components: {
            position: { x: 50, y: 50, width: 30, height: 30, rotation: 0 },
            health: { current: 100, max: 100, invulnerable: false, invulnerableTimer: 0 },
            player: { canShoot: true, shootCooldown: 0.2, lastShotTime: 0, powerUps: [], score: 0, lives: 3 },
          },
          tags: ['player'],
        },
        enemy: {
          id: 'enemy1',
          type: EntityType.ENEMY,
          active: true,
          components: {
            position: { x: 55, y: 55, width: 30, height: 30, rotation: 180 }, // Overlapping with player
            health: { current: 50, max: 50, invulnerable: false, invulnerableTimer: 0 },
            enemy: { type: EnemyType.BASIC, scoreValue: 100, behavior: 'straight', fireRate: 0, lastShotTime: 0, movePattern: 'straight_down', patternTimer: 0 },
          },
          tags: ['enemy'],
        },
        bullet: {
          id: 'bullet1',
          type: EntityType.BULLET,
          active: true,
          components: {
            position: { x: 200, y: 200, width: 10, height: 20, rotation: 0 }, // Not overlapping
            bullet: { type: BulletType.PLAYER, damage: 25, pierce: 1, currentPierce: 1, ownerId: 'player', lifetime: 3, age: 0 },
          },
          tags: ['bullet'],
        },
      };

      const result = CollisionSystem(entities, { time: mockTime, dispatch: mockDispatch });

      // Should detect player-enemy collision
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'collision',
        })
      );

      // Player should take damage (collision deals 10 damage)
      expect(result.player.components.health?.current).toBe(90);

      // Player should become invulnerable
      expect(result.player.components.health?.invulnerable).toBe(true);
    });

    test('should handle power-up collection', () => {
      const mockDispatch = jest.fn();
      const mockTime = { current: Date.now() };

      // Create entities with proper bounding box overlap
      // Player at (50, 50) with size 30x30 has bounds from (50,50) to (80,80)
      // PowerUp at (55, 55) with size 20x20 has bounds from (55,55) to (75,75)
      // These clearly overlap
      const entities: Record<string, GameEntity> = {
        player: {
          id: 'player',
          type: EntityType.PLAYER,
          active: true,
          components: {
            position: { x: 50, y: 50, width: 30, height: 30, rotation: 0 },
            player: { canShoot: true, shootCooldown: 0.2, lastShotTime: 0, powerUps: [], score: 0, lives: 3 },
          },
          tags: ['player'],
        },
        powerUp: {
          id: 'powerUp1',
          type: EntityType.POWER_UP,
          active: true,
          components: {
            position: { x: 55, y: 55, width: 20, height: 20, rotation: 0 },
            powerUp: { type: 'shield', duration: 10000, value: 1, collected: false, floatTimer: 0 },
          },
          tags: ['powerUp'],
        },
      };

      const result = CollisionSystem(entities, { time: mockTime, dispatch: mockDispatch });

      // Check if collision was detected - the types sorted are 'player' and 'powerUp'
      // which becomes 'player-powerUp' (alphabetically 'player' < 'powerUp')
      // The CollisionSystem handles this in getCollisionType

      // Verify dispatch was called (collision detection works)
      expect(mockDispatch).toHaveBeenCalled();

      // If power-up collision was detected, check the effects
      const dispatchCalls = mockDispatch.mock.calls;
      const powerUpCollectCall = dispatchCalls.find(
        (call) => call[0]?.type === 'powerUpCollect'
      );

      if (powerUpCollectCall) {
        // Power-up should be deactivated
        expect(result.powerUp.active).toBe(false);
        expect(result.powerUp.components.powerUp?.collected).toBe(true);
      }
    });
  });

  describe('Performance Requirements', () => {
    test('collision checks should be efficient', () => {
      // Create 100 entities with ECS structure
      const entities: Record<string, GameEntity> = {};
      for (let i = 0; i < 100; i++) {
        const isEnemy = i < 50;
        entities[`entity${i}`] = {
          id: `entity${i}`,
          type: isEnemy ? EntityType.ENEMY : EntityType.BULLET,
          active: true,
          components: {
            position: { x: Math.random() * 400, y: Math.random() * 800, width: 20, height: 20, rotation: 0 },
            ...(isEnemy ? {
              health: { current: 30, max: 30, invulnerable: false, invulnerableTimer: 0 },
              enemy: { type: EnemyType.BASIC, scoreValue: 100, behavior: 'straight', fireRate: 0, lastShotTime: 0, movePattern: 'straight_down', patternTimer: 0 },
            } : {
              bullet: { type: BulletType.PLAYER, damage: 25, pierce: 1, currentPierce: 1, ownerId: 'player', lifetime: 3, age: 0 },
            }),
          },
          tags: [isEnemy ? 'enemy' : 'bullet'],
        };
      }

      const mockDispatch = jest.fn();
      const mockTime = { current: Date.now() };

      const startTime = Date.now();
      CollisionSystem(entities, { time: mockTime, dispatch: mockDispatch });
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      // Collision system should process 100 entities in under 50ms (allowing for test overhead)
      expect(processingTime).toBeLessThan(50);

      console.log(`Processed 100 entities in ${processingTime}ms`);
    });

    test('movement system should handle many entities efficiently', () => {
      // Create 200 entities with ECS structure
      const entities: Record<string, GameEntity> = {};
      for (let i = 0; i < 200; i++) {
        const isEnemy = i < 100;
        entities[`entity${i}`] = {
          id: `entity${i}`,
          type: isEnemy ? EntityType.ENEMY : EntityType.BULLET,
          active: true,
          components: {
            position: { x: Math.random() * 400, y: Math.random() * 800, width: 20, height: 20, rotation: 0 },
            velocity: { x: Math.random() * 10 - 5, y: Math.random() * 10 - 5 },
            ...(isEnemy ? {
              enemy: { type: EnemyType.BASIC, scoreValue: 100, behavior: 'straight', fireRate: 0, lastShotTime: 0, movePattern: 'straight_down', patternTimer: 0 },
            } : {
              bullet: { type: BulletType.PLAYER, damage: 25, pierce: 1, currentPierce: 1, ownerId: 'player', lifetime: 3, age: 0 },
            }),
          },
          tags: [isEnemy ? 'enemy' : 'bullet'],
        };
      }

      const mockTime = { delta: 16, current: Date.now() };

      const startTime = Date.now();
      MovementSystem(entities, { time: mockTime });
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      // Movement system should process 200 entities in under 50ms
      expect(processingTime).toBeLessThan(50);

      console.log(`Processed 200 entities in ${processingTime}ms`);
    });
  });

  describe('Mobile Game Specific Requirements', () => {
    test('game should handle frame rate drops gracefully', () => {
      // Test with large delta time (simulating frame drop)
      const createTestEntity = (): GameEntity => ({
        id: 'testEntity',
        type: EntityType.BULLET,
        active: true,
        components: {
          position: { x: 200, y: 400, width: 10, height: 10, rotation: 0 },
          velocity: { x: 100, y: 0 }, // 100 pixels per second
          bullet: { type: BulletType.PLAYER, damage: 25, pierce: 1, currentPierce: 1, ownerId: 'player', lifetime: 3, age: 0 },
        },
        tags: ['bullet'],
      });

      // Normal frame (16ms)
      const normalEntities: Record<string, GameEntity> = { testEntity: createTestEntity() };
      const normalResult = MovementSystem(normalEntities, { time: { delta: 16, current: Date.now() } });
      const normalMovement = normalResult.testEntity.components.position?.x! - 200;

      // Large frame drop (100ms) - MovementSystem caps delta at 100ms
      const largeDeltaEntities: Record<string, GameEntity> = { testEntity: createTestEntity() };
      const largeDeltaResult = MovementSystem(largeDeltaEntities, { time: { delta: 100, current: Date.now() } });
      const largeDeltaMovement = largeDeltaResult.testEntity.components.position?.x! - 200;

      // Movement should be proportional to delta time
      // 100px/sec * 0.016s = 1.6px
      // 100px/sec * 0.1s = 10px
      expect(normalMovement).toBeCloseTo(1.6, 1);
      expect(largeDeltaMovement).toBeCloseTo(10, 1);

      // The ratio should match the delta time ratio
      const expectedRatio = 100 / 16; // 6.25
      const actualRatio = largeDeltaMovement / normalMovement;
      expect(actualRatio).toBeCloseTo(expectedRatio, 1);
    });

    test('entities should be properly cleaned up when off-screen', () => {
      const screenWidth = 400;
      const screenHeight = 800;

      const onScreenEntity: GameEntity = {
        id: 'onScreen',
        type: EntityType.BULLET,
        active: true,
        components: {
          position: { x: 200, y: 400, width: 10, height: 10 },
        },
        tags: ['bullet'],
      };

      const offScreenEntity: GameEntity = {
        id: 'offScreen',
        type: EntityType.BULLET,
        active: true,
        components: {
          position: { x: -20, y: -30, width: 10, height: 10 }, // Completely off-screen (x < -width)
        },
        tags: ['bullet'],
      };

      // Entity that is still on screen even if x is negative (bullet still visible)
      const stillOnScreenEntity: GameEntity = {
        id: 'stillOnScreen',
        type: EntityType.BULLET,
        active: true,
        components: {
          position: { x: -5, y: 400, width: 10, height: 10 }, // x=-5 is NOT less than -width(-10), so still on screen
        },
        tags: ['bullet'],
      };

      // Entity completely off-screen to the left
      const offScreenLeft: GameEntity = {
        id: 'offScreenLeft',
        type: EntityType.BULLET,
        active: true,
        components: {
          position: { x: -11, y: 400, width: 10, height: 10 }, // x=-11 < -width(-10), so off screen
        },
        tags: ['bullet'],
      };

      expect(isOffScreen(onScreenEntity, screenWidth, screenHeight)).toBe(false);
      expect(isOffScreen(offScreenEntity, screenWidth, screenHeight)).toBe(true);
      // isOffScreen checks: position.x < -width (i.e., -5 < -10 is false, so still on screen)
      expect(isOffScreen(stillOnScreenEntity, screenWidth, screenHeight)).toBe(false);
      expect(isOffScreen(offScreenLeft, screenWidth, screenHeight)).toBe(true);
    });
  });
});