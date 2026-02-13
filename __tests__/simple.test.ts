// Simple test to verify core game systems work
import { clamp, random, distance } from '../src/utils/math';
import { checkAABBCollision } from '../src/utils/collision';

describe('Core Game Systems - Simple Tests', () => {
  describe('Math Utilities', () => {
    test('clamp function works correctly', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-1, 0, 10)).toBe(0);
      expect(clamp(11, 0, 10)).toBe(10);
    });

    test('random generates numbers within range', () => {
      const value = random(10, 20);
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThan(20);
    });

    test('distance calculates Euclidean distance', () => {
      expect(distance(0, 0, 3, 4)).toBe(5);
      expect(distance(1, 1, 4, 5)).toBe(5);
    });
  });

  describe('Collision Detection', () => {
    test('AABB collision detection works', () => {
      const rect1 = { x: 0, y: 0, width: 10, height: 10 };
      const rect2 = { x: 5, y: 5, width: 10, height: 10 };
      const rect3 = { x: 20, y: 20, width: 10, height: 10 };

      expect(checkAABBCollision(rect1, rect2)).toBe(true);
      expect(checkAABBCollision(rect1, rect3)).toBe(false);
    });
  });

  describe('Game Logic', () => {
    test('basic game logic functions', () => {
      // Test that our utility functions are working
      const numbers = [1, 2, 3, 4, 5];
      const clamped = numbers.map(n => clamp(n, 2, 4));
      expect(clamped).toEqual([2, 2, 3, 4, 4]);
    });
  });
});