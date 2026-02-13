// Foundation tests for mobile game core systems
import { MovementSystem } from '../../../src/game/systems/MovementSystem';
import { CollisionSystem } from '../../../src/game/systems/CollisionSystem';
import { clamp, random, distance } from '../../../src/utils/math';
import { checkAABBCollision, SpatialGrid } from '../../../src/utils/collision';

describe('Mobile Game Foundation Tests', () => {
  describe('Math Utilities', () => {
    test('clamp should limit values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(5, 10, 0)).toBe(5); // Should handle reversed min/max
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
    test('should create movement component with defaults', () => {
      const component = MovementSystem.createMovementComponent({ x: 5, y: 10 });

      expect(component.velocity.x).toBe(5);
      expect(component.velocity.y).toBe(10);
      expect(component.maxSpeed).toBe(500);
      expect(component.friction).toBe(0.95);
    });

    test('should handle screen boundaries for player', () => {
      const mockTime = { delta: 16 }; // ~60fps

      const entities = {
        player: {
          type: 'player',
          active: true,
          position: { x: -10, y: 500 },
          size: { width: 40, height: 40 },
          velocity: { x: 0, y: 0 },
          controls: { touchPosition: null },
        },
      };

      // Mock screen dimensions
      jest.spyOn(require('react-native'), 'Dimensions').mockReturnValue({
        get: () => ({ width: 400, height: 800 }),
      });

      const result = MovementSystem(entities, { time: mockTime });

      // Player should be clamped to screen
      expect(result.player.position.x).toBe(20); // width/2
      expect(result.player.position.y).toBe(780); // height - size.height/2
    });
  });

  describe('Collision System', () => {
    test('should detect collision types correctly', () => {
      // Mock dispatch function
      const mockDispatch = jest.fn();
      const mockTime = { current: Date.now() };

      const entities = {
        player: {
          type: 'player',
          active: true,
          position: { x: 50, y: 50 },
          size: { width: 30, height: 30 },
          health: 100,
          invulnerable: false,
        },
        enemy: {
          type: 'enemy',
          active: true,
          position: { x: 55, y: 55 }, // Overlapping with player
          size: { width: 30, height: 30 },
          health: 50,
          damage: 10,
          enemyType: 'basic',
          points: 100,
        },
        bullet: {
          type: 'bullet',
          active: true,
          position: { x: 200, y: 200 }, // Not overlapping
          size: { width: 10, height: 20 },
          bulletType: 'player',
          damage: 25,
        },
      };

      const result = CollisionSystem(entities, { time: mockTime, dispatch: mockDispatch });

      // Should detect player-enemy collision
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'collision',
          data: expect.objectContaining({
            collisionType: 'player-enemy',
          }),
        })
      );

      // Player should take damage
      expect(result.player.health).toBe(90); // 100 - 10 damage

      // Player should become invulnerable
      expect(result.player.invulnerable).toBe(true);
      expect(result.player.invulnerableUntil).toBeGreaterThan(mockTime.current);
    });

    test('should handle power-up collection', () => {
      const mockDispatch = jest.fn();
      const mockTime = { current: Date.now() };

      const entities = {
        player: {
          type: 'player',
          active: true,
          position: { x: 50, y: 50 },
          size: { width: 30, height: 30 },
          activePowerUps: [],
        },
        powerUp: {
          type: 'powerUp',
          active: true,
          position: { x: 55, y: 55 }, // Overlapping
          size: { width: 20, height: 20 },
          powerUpType: 'shield',
          duration: 10000,
        },
      };

      const result = CollisionSystem(entities, { time: mockTime, dispatch: mockDispatch });

      // Should detect power-up collection
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'powerUpCollect',
          data: expect.objectContaining({
            powerUpType: 'shield',
          }),
        })
      );

      // Power-up should be deactivated
      expect(result.powerUp.active).toBe(false);

      // Player should have shield active
      expect(result.player.shieldActive).toBe(true);
      expect(result.player.shieldEndTime).toBeGreaterThan(mockTime.current);
    });
  });

  describe('Performance Requirements', () => {
    test('collision checks should be efficient', () => {
      // Create 100 entities
      const entities: Record<string, any> = {};
      for (let i = 0; i < 100; i++) {
        entities[`entity${i}`] = {
          type: i < 50 ? 'enemy' : 'bullet',
          active: true,
          position: { x: Math.random() * 400, y: Math.random() * 800 },
          size: { width: 20, height: 20 },
        };
      }

      const mockDispatch = jest.fn();
      const mockTime = { current: Date.now() };

      const startTime = Date.now();
      CollisionSystem(entities, { time: mockTime, dispatch: mockDispatch });
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      // Collision system should process 100 entities in under 16ms (60fps)
      expect(processingTime).toBeLessThan(16);

      console.log(`Processed 100 entities in ${processingTime}ms`);
    });

    test('movement system should handle many entities efficiently', () => {
      // Create 200 entities
      const entities: Record<string, any> = {};
      for (let i = 0; i < 200; i++) {
        entities[`entity${i}`] = {
          type: i < 100 ? 'enemy' : 'bullet',
          active: true,
          position: { x: Math.random() * 400, y: Math.random() * 800 },
          size: { width: 20, height: 20 },
          velocity: { x: Math.random() * 10 - 5, y: Math.random() * 10 - 5 },
          enemyType: 'basic',
        };
      }

      const mockTime = { delta: 16 };

      const startTime = Date.now();
      MovementSystem(entities, { time: mockTime });
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      // Movement system should process 200 entities in under 16ms (60fps)
      expect(processingTime).toBeLessThan(16);

      console.log(`Processed 200 entities in ${processingTime}ms`);
    });
  });

  describe('Mobile Game Specific Requirements', () => {
    test('game should handle frame rate drops gracefully', () => {
      // Test with large delta time (simulating frame drop)
      const entities = {
        player: {
          type: 'player',
          active: true,
          position: { x: 200, y: 400 },
          size: { width: 30, height: 30 },
          velocity: { x: 100, y: 0 }, // 100 pixels per second
          controls: { touchPosition: null },
        },
      };

      // Normal frame (16ms)
      const normalResult = MovementSystem({ ...entities }, { time: { delta: 16 } });
      const normalMovement = normalResult.player.position.x - entities.player.position.x;

      // Large frame drop (100ms)
      const largeDeltaResult = MovementSystem({ ...entities }, { time: { delta: 100 } });
      const largeDeltaMovement = largeDeltaResult.player.position.x - entities.player.position.x;

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
      const { isOffScreen } = require('../../../src/game/systems/CollisionSystem');

      const screenWidth = 400;
      const screenHeight = 800;

      const onScreenEntity = {
        type: 'bullet',
        position: { x: 200, y: 400 },
        size: { width: 10, height: 20 },
      };

      const offScreenEntity = {
        type: 'bullet',
        position: { x: -20, y: -30 }, // Completely off-screen
        size: { width: 10, height: 20 },
      };

      const partiallyOffScreen = {
        type: 'bullet',
        position: { x: -5, y: 400 }, // Partially off-screen (edge case)
        size: { width: 10, height: 20 },
      };

      expect(isOffScreen(onScreenEntity, screenWidth, screenHeight)).toBe(false);
      expect(isOffScreen(offScreenEntity, screenWidth, screenHeight)).toBe(true);
      expect(isOffScreen(partiallyOffScreen, screenWidth, screenHeight)).toBe(true);
    });
  });
});