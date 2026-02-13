import { Position, Size, BoundingBox, EnemyType } from '../types';

// Math utilities
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const random = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Vector operations
export const addVectors = (a: Position, b: Position): Position => ({
  x: a.x + b.x,
  y: a.y + b.y,
});

export const subtractVectors = (a: Position, b: Position): Position => ({
  x: a.x - b.x,
  y: a.y - b.y,
});

export const multiplyVector = (vector: Position, scalar: number): Position => ({
  x: vector.x * scalar,
  y: vector.y * scalar,
});

export const vectorLength = (vector: Position): number => {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
};

export const normalizeVector = (vector: Position): Position => {
  const length = vectorLength(vector);
  if (length === 0) return { x: 0, y: 0 };
  return {
    x: vector.x / length,
    y: vector.y / length,
  };
};

// Collision detection
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

export const getBoundingBox = (position: Position, size: Size): BoundingBox => ({
  x: position.x - size.width / 2,
  y: position.y - size.height / 2,
  width: size.width,
  height: size.height,
});

export const checkCircleCollision = (
  pos1: Position,
  radius1: number,
  pos2: Position,
  radius2: number
): boolean => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < radius1 + radius2;
};

// Enemy AI patterns
export const getBasicEnemyMovement = (
  position: Position,
  speed: number,
  time: number
): Position => {
  // Simple sinusoidal movement
  return {
    x: position.x + Math.sin(time * 0.001) * 2,
    y: position.y + speed,
  };
};

export const getDivingEnemyMovement = (
  position: Position,
  target: Position,
  speed: number,
  isDiving: boolean
): { position: Position; isDiving: boolean } => {
  if (!isDiving) {
    // Move downward until dive threshold
    return {
      position: { x: position.x, y: position.y + speed },
      isDiving: position.y > 150, // Start diving when below threshold
    };
  }

  // Dive toward target
  const direction = normalizeVector(subtractVectors(target, position));
  const newPosition = addVectors(position, multiplyVector(direction, speed * 1.5));

  // Return to formation if past player
  if (newPosition.y > target.y + 100) {
    return {
      position: { x: position.x, y: position.y - speed },
      isDiving: false,
    };
  }

  return { position: newPosition, isDiving: true };
};

export const getShootingEnemyMovement = (
  position: Position,
  speed: number,
  time: number
): Position => {
  // Move side to side while slowly descending
  return {
    x: position.x + Math.sin(time * 0.002) * 3,
    y: position.y + speed * 0.5,
  };
};

// Wave generation
export const generateWaveEnemies = (
  waveNumber: number,
  screenWidth: number,
  enemyTypes: EnemyType[] = ['basic', 'diving', 'shooting']
): Array<{
  type: EnemyType;
  position: Position;
  health: number;
}> => {
  const enemies = [];
  const enemyCount = Math.floor(waveNumber * 1.5) + 3;
  const columns = Math.min(enemyCount, 5);
  const rows = Math.ceil(enemyCount / columns);

  const horizontalSpacing = screenWidth / (columns + 1);
  const verticalSpacing = 80;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const index = row * columns + col;
      if (index >= enemyCount) break;

      const type = enemyTypes[index % enemyTypes.length];
      const position = {
        x: horizontalSpacing * (col + 1),
        y: 50 + row * verticalSpacing,
      };

      // Increase health with wave number
      const baseHealth = type === 'boss' ? 500 : type === 'diving' ? 50 : 30;
      const healthMultiplier = 1 + (waveNumber - 1) * 0.2;
      const health = Math.floor(baseHealth * healthMultiplier);

      enemies.push({ type, position, health });
    }
  }

  // Add boss every 5 waves
  if (waveNumber % 5 === 0) {
    enemies.push({
      type: 'boss',
      position: { x: screenWidth / 2, y: 100 },
      health: 500 * (1 + (waveNumber / 5 - 1) * 0.5),
    });
  }

  return enemies;
};

// Power-up generation
export const generatePowerUp = (
  position: Position,
  screenWidth: number
): {
  type: 'shield' | 'rapidFire' | 'multiShot' | 'bomb';
  position: Position;
} => {
  const types: Array<'shield' | 'rapidFire' | 'multiShot' | 'bomb'> = [
    'shield',
    'rapidFire',
    'multiShot',
    'bomb',
  ];
  const type = types[Math.floor(Math.random() * types.length)];

  return {
    type,
    position: {
      x: Math.max(30, Math.min(screenWidth - 30, position.x)),
      y: position.y,
    },
  };
};

// Score calculation
export const calculateScore = (
  enemyType: EnemyType,
  waveNumber: number,
  isBoss: boolean = false
): number => {
  const baseScores = {
    basic: 100,
    diving: 200,
    shooting: 150,
    boss: 1000,
  };

  const baseScore = isBoss ? 1000 : baseScores[enemyType];
  const waveMultiplier = 1 + (waveNumber - 1) * 0.1;
  return Math.floor(baseScore * waveMultiplier);
};

// Difficulty scaling
export const getDifficultyMultiplier = (difficulty: 'easy' | 'medium' | 'hard') => {
  switch (difficulty) {
    case 'easy':
      return { enemySpeed: 0.8, enemyHealth: 0.8, enemyDamage: 0.8 };
    case 'medium':
      return { enemySpeed: 1.0, enemyHealth: 1.0, enemyDamage: 1.0 };
    case 'hard':
      return { enemySpeed: 1.2, enemyHealth: 1.2, enemyDamage: 1.2 };
  }
};