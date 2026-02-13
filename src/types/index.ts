// Game Entity Types - Entity-Component-System (ECS) Pattern
export interface Position {
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
}

export interface Velocity {
  x: number;
  y: number;
  maxSpeed?: number;
  acceleration?: number;
  friction?: number;
  floatAmplitude?: number;
  floatFrequency?: number;
}

export interface Health {
  current: number;
  max: number;
  invulnerable?: boolean;
  invulnerableTimer?: number;
}

export interface ActivePowerUp {
  type: PowerUpType;
  endTime: number;
  effectApplied: boolean;
}

export interface PlayerComponent {
  canShoot: boolean;
  shootCooldown: number;
  lastShotTime: number;
  powerUps: string[];
  activePowerUps?: ActivePowerUp[];
  score: number;
  lives: number;
  touchPosition?: Position;
}

export interface EnemyComponent {
  type: EnemyType;
  scoreValue: number;
  behavior: string;
  fireRate: number;
  lastShotTime: number;
  movePattern: string;
  patternTimer: number;
  diveChance?: number;
  diveDirection?: number;
  zigzagAmplitude?: number;
  zigzagFrequency?: number;
  phase?: number;
  attackPattern?: string;
  patternCooldown?: number;
}

export interface BulletComponent {
  type: BulletType;
  damage: number;
  pierce: number;
  currentPierce: number;
  ownerId: string;
  lifetime: number;
  age: number;
  homing?: boolean;
  homingStrength?: number;
  ricochet?: boolean;
  ricochetCount?: number;
  currentRicochet?: number;
}

export interface PowerUpComponent {
  type: PowerUpType;
  duration: number;
  value: number;
  collected: boolean;
  collectedTime?: number;
  floatTimer: number;
}

export interface Collider {
  type: 'circle' | 'rectangle';
  radius?: number;
  width?: number;
  height?: number;
  isTrigger: boolean;
  layer: string;
  mask: string[];
}

export interface Renderable {
  visible: boolean;
  zIndex: number;
  sprite?: string;
  color: string;
  alpha: number;
  glowEffect?: boolean;
  pulseEffect?: boolean;
  pulseSpeed?: number;
  trailEffect?: boolean;
  trailLength?: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Entity Types
export enum EntityType {
  PLAYER = 'player',
  ENEMY = 'enemy',
  BULLET = 'bullet',
  POWER_UP = 'powerUp',
  BACKGROUND = 'background',
  PARTICLE = 'particle',
}

// Enemy Types
export enum EnemyType {
  BASIC = 'basic',
  DIVING = 'diving',
  SHOOTING = 'shooting',
  BOSS = 'boss',
}

// Bullet Types
export enum BulletType {
  PLAYER = 'player',
  ENEMY = 'enemy',
  POWER_UP = 'powerUp',
}

// Power-up Types
export enum PowerUpType {
  SHIELD = 'shield',
  RAPID_FIRE = 'rapidFire',
  MULTI_SHOT = 'multiShot',
  BOMB = 'bomb',
  HEALTH = 'health',
  SCORE = 'score',
}

// Game Entity with ECS components
export interface GameEntity {
  id: string;
  type: EntityType;
  active: boolean;
  tags: string[];
  components: {
    position?: Position;
    velocity?: Velocity;
    acceleration?: { x: number; y: number };
    health?: Health;
    player?: PlayerComponent;
    enemy?: EnemyComponent;
    bullet?: BulletComponent;
    powerUp?: PowerUpComponent;
    collider?: Collider;
    renderable?: Renderable;
  };
}

// Game State
export interface GameState {
  currentScreen: 'menu' | 'game' | 'gameOver';
  score: number;
  highScore: number;
  lives: number;
  currentWave: number;
  isPaused: boolean;
  gameTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  playerPowerUps: string[];
  gameOverReason?: 'noLives' | 'timeUp' | 'bossDefeated';
  lastSpawnTime: number;
}

// Touch Controls
export interface TouchControls {
  touchArea: BoundingBox | null;
  isDragging: boolean;
  dragStart: Position;
  currentTouch: Position | null;
}

// Game Events
export type GameEventType =
  | 'playerShoot'
  | 'enemyShoot'
  | 'collision'
  | 'powerUpCollect'
  | 'enemyDestroyed'
  | 'playerHit'
  | 'gameOver'
  | 'waveComplete'
  | 'bossSpawn';

export interface GameEvent {
  type: GameEventType;
  data?: any;
  timestamp: number;
}

// Props for game components
export interface GameEngineProps {
  width: number;
  height: number;
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (reason: string) => void;
  onPause?: () => void;
}

// Screen navigation types
export type RootStackParamList = {
  Menu: undefined;
  Game: undefined;
  GameOver: { score: number; highScore: number; reason?: string };
  Settings: undefined;
};