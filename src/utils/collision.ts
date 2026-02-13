// Collision detection utilities for game development
import { Position, Size, BoundingBox } from '../types';

// Axis-Aligned Bounding Box collision
export const checkAABBCollision = (
  rect1: BoundingBox,
  rect2: BoundingBox
): boolean => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

// Circle collision
export const checkCircleCollision = (
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): boolean => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < r1 + r2;
};

// Circle to AABB collision
export const checkCircleAABBCollision = (
  circleX: number,
  circleY: number,
  radius: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number
): boolean => {
  // Find the closest point on the rectangle to the circle
  const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
  const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));

  // Calculate distance between circle center and closest point
  const distanceX = circleX - closestX;
  const distanceY = circleY - closestY;

  // Check if distance is less than radius
  return (distanceX * distanceX + distanceY * distanceY) < (radius * radius);
};

// Point in AABB
export const pointInAABB = (
  px: number,
  py: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number
): boolean => {
  return (
    px >= rectX &&
    px <= rectX + rectWidth &&
    py >= rectY &&
    py <= rectY + rectHeight
  );
};

// Point in circle
export const pointInCircle = (
  px: number,
  py: number,
  cx: number,
  cy: number,
  radius: number
): boolean => {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
};

// Get bounding box from position and size
export const getBoundingBox = (position: Position, size: Size): BoundingBox => ({
  x: position.x - size.width / 2,
  y: position.y - size.height / 2,
  width: size.width,
  height: size.height,
});

// Get bounding box from center position and radius
export const getCircleBoundingBox = (
  centerX: number,
  centerY: number,
  radius: number
): BoundingBox => ({
  x: centerX - radius,
  y: centerY - radius,
  width: radius * 2,
  height: radius * 2,
});

// Check if two bounding boxes overlap with optional padding
export const boxesOverlap = (
  box1: BoundingBox,
  box2: BoundingBox,
  padding: number = 0
): boolean => {
  return (
    box1.x - padding < box2.x + box2.width + padding &&
    box1.x + box1.width + padding > box2.x - padding &&
    box1.y - padding < box2.y + box2.height + padding &&
    box1.y + box1.height + padding > box2.y - padding
  );
};

// Calculate overlap resolution for AABB collision
export const resolveAABBCollision = (
  movingBox: BoundingBox,
  staticBox: BoundingBox
): { x: number; y: number } | null => {
  if (!checkAABBCollision(movingBox, staticBox)) {
    return null;
  }

  // Calculate overlap on each axis
  const overlapLeft = movingBox.x + movingBox.width - staticBox.x;
  const overlapRight = staticBox.x + staticBox.width - movingBox.x;
  const overlapTop = movingBox.y + movingBox.height - staticBox.y;
  const overlapBottom = staticBox.y + staticBox.height - movingBox.y;

  // Find the smallest overlap
  const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

  // Resolve based on smallest overlap
  if (minOverlap === overlapLeft) {
    return { x: -overlapLeft, y: 0 };
  } else if (minOverlap === overlapRight) {
    return { x: overlapRight, y: 0 };
  } else if (minOverlap === overlapTop) {
    return { x: 0, y: -overlapTop };
  } else {
    return { x: 0, y: overlapBottom };
  }
};

// Check collision between multiple entities efficiently
export const checkCollisions = (
  entities: Array<{ id: string; bounds: BoundingBox }>
): Array<{ id1: string; id2: string }> => {
  const collisions: Array<{ id1: string; id2: string }> = [];
  const count = entities.length;

  // Simple pairwise check (optimize with spatial partitioning later)
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      if (checkAABBCollision(entities[i].bounds, entities[j].bounds)) {
        collisions.push({ id1: entities[i].id, id2: entities[j].id });
      }
    }
  }

  return collisions;
};

// Broad phase collision detection using grid spatial partitioning
export class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, Set<string>>;

  constructor(cellSize: number = 100) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  clear(): void {
    this.grid.clear();
  }

  insert(id: string, bounds: BoundingBox): void {
    const startCellX = Math.floor(bounds.x / this.cellSize);
    const startCellY = Math.floor(bounds.y / this.cellSize);
    const endCellX = Math.floor((bounds.x + bounds.width) / this.cellSize);
    const endCellY = Math.floor((bounds.y + bounds.height) / this.cellSize);

    for (let x = startCellX; x <= endCellX; x++) {
      for (let y = startCellY; y <= endCellY; y++) {
        const key = `${x},${y}`;
        if (!this.grid.has(key)) {
          this.grid.set(key, new Set());
        }
        this.grid.get(key)!.add(id);
      }
    }
  }

  getPotentialCollisions(id: string, bounds: BoundingBox): Set<string> {
    const potentials = new Set<string>();
    const startCellX = Math.floor(bounds.x / this.cellSize);
    const startCellY = Math.floor(bounds.y / this.cellSize);
    const endCellX = Math.floor((bounds.x + bounds.width) / this.cellSize);
    const endCellY = Math.floor((bounds.y + bounds.height) / this.cellSize);

    for (let x = startCellX; x <= endCellX; x++) {
      for (let y = startCellY; y <= endCellY; y++) {
        const key = `${x},${y}`;
        const cell = this.grid.get(key);
        if (cell) {
          cell.forEach(otherId => {
            if (otherId !== id) {
              potentials.add(otherId);
            }
          });
        }
      }
    }

    return potentials;
  }
}