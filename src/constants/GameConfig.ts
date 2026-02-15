/**
 * Game Configuration Constants
 * Centralized configuration for game balance and tuning.
 * All magic numbers should be extracted here for easy adjustment.
 */

/**
 * Screen and boundary configuration
 */
export const SCREEN_CONFIG = {
  /** Padding around screen edges for entity cleanup */
  BOUNDARY_PADDING: 100,
  /** Spawn position offset above screen */
  SPAWN_OFFSET: 50,
  /** Default entity size when not specified */
  DEFAULT_ENTITY_SIZE: 40,
} as const;

/**
 * Player configuration
 */
export const PLAYER_CONFIG = {
  /** Player ship dimensions */
  WIDTH: 40,
  HEIGHT: 40,
  /** Movement speed limit in pixels per second */
  MAX_SPEED: 300,
  /** Movement acceleration in pixels per second squared */
  ACCELERATION: 800,
  /** Movement friction coefficient */
  FRICTION: 600,
  /** Health points */
  MAX_HEALTH: 100,
  INITIAL_HEALTH: 100,
  /** Shooting cooldown in seconds */
  SHOOT_COOLDOWN: 0.2,
  /** Initial lives */
  INITIAL_LIVES: 3,
  /** Maximum lives */
  MAX_LIVES: 5,
  /** Collision radius */
  COLLISION_RADIUS: 20,
  /** Invulnerability duration after being hit (ms) */
  INVULNERABILITY_DURATION: 1000,
  /** Respawn invulnerability duration (ms) */
  RESPAWN_INVULNERABILITY_DURATION: 2000,
  /** Maximum stored power-ups */
  MAX_POWER_UPS: 3,
  /** Bomb cooldown in milliseconds */
  BOMB_COOLDOWN: 5000,
} as const;

/**
 * Enemy configuration by type
 */
export const ENEMY_CONFIG = {
  BASIC: {
    WIDTH: 30,
    HEIGHT: 30,
    HEALTH: 30,
    SCORE_VALUE: 100,
    SPEED: 80,
    MAX_SPEED: 100,
    ACCELERATION: 200,
    FRICTION: 100,
    COLLISION_RADIUS: 15,
    FIRE_RATE: 0,
    DIVE_CHANCE: 0.1,
  },
  DIVING: {
    WIDTH: 35,
    HEIGHT: 35,
    HEALTH: 50,
    SCORE_VALUE: 200,
    SPEED: 100,
    MAX_SPEED: 150,
    ACCELERATION: 300,
    FRICTION: 150,
    COLLISION_RADIUS: 17,
    FIRE_RATE: 0,
    DIVE_CHANCE: 0.3,
  },
  SHOOTING: {
    WIDTH: 32,
    HEIGHT: 32,
    HEALTH: 40,
    SCORE_VALUE: 150,
    SPEED: 60,
    MAX_SPEED: 80,
    ACCELERATION: 150,
    FRICTION: 80,
    COLLISION_RADIUS: 16,
    FIRE_RATE: 1.5,
    ZIGZAG_AMPLITUDE: 50,
    ZIGZAG_FREQUENCY: 2,
    DIVE_CHANCE: 0.05,
  },
  BOSS: {
    WIDTH: 80,
    HEIGHT: 80,
    HEALTH: 500,
    SCORE_VALUE: 1000,
    SPEED: 20,
    MAX_SPEED: 50,
    ACCELERATION: 100,
    FRICTION: 50,
    COLLISION_RADIUS: 40,
    FIRE_RATE: 0.8,
    FLOAT_AMPLITUDE: 20,
    FLOAT_FREQUENCY: 1,
  },
} as const;

/**
 * Bullet configuration by type
 */
export const BULLET_CONFIG = {
  PLAYER: {
    SPEED: 500,
    DAMAGE: 25,
    LIFETIME: 3,
    WIDTH: 8,
    HEIGHT: 16,
    COLOR: '#4FC3F7',
  },
  ENEMY: {
    SPEED: 300,
    DAMAGE: 20,
    LIFETIME: 4,
    WIDTH: 6,
    HEIGHT: 12,
    COLOR: '#FF6B6B',
  },
  /** Default bullet properties */
  DEFAULT: {
    PIERCE: 1,
    LIFETIME: 3,
  },
} as const;

/**
 * Power-up configuration
 */
export const POWERUP_CONFIG = {
  /** Float animation amplitude */
  FLOAT_AMPLITUDE: 10,
  /** Float animation frequency */
  FLOAT_FREQUENCY: 2,
  /** Downward drift speed */
  DRIFT_SPEED: 50,
  /** Default power-up duration in milliseconds */
  DEFAULT_DURATION: 10000,
  /** Collision radius for collection */
  COLLISION_RADIUS: 20,
  /** Chance to drop power-up when enemy destroyed */
  DROP_CHANCE: 0.15,
  /** Power-up types with their properties */
  TYPES: {
    SHIELD: { duration: 10000, color: '#4FC3F7' },
    RAPID_FIRE: { duration: 8000, color: '#FFA726' },
    MULTI_SHOT: { duration: 10000, color: '#66BB6A' },
    BOMB: { duration: 0, color: '#EF5350' },
    HEALTH: { duration: 0, value: 25, color: '#4CAF50' },
    SCORE: { duration: 0, value: 500, color: '#FFD700' },
  },
} as const;

/**
 * Collision system configuration
 */
export const COLLISION_CONFIG = {
  /** Spatial grid cell size in pixels */
  SPATIAL_GRID_CELL_SIZE: 100,
  /** Damage from player-enemy collision */
  PLAYER_ENEMY_DAMAGE: 10,
  /** Damage player deals to enemy on collision */
  PLAYER_COLLISION_DAMAGE: 5,
} as const;

/**
 * Wave system configuration
 */
export const WAVE_CONFIG = {
  /** Base enemy count for wave 1 */
  BASE_ENEMY_COUNT: 5,
  /** Enemy count multiplier per wave */
  ENEMY_COUNT_MULTIPLIER: 1.5,
  /** Interval between boss waves */
  BOSS_WAVE_INTERVAL: 5,
  /** Spawn delay between enemies in ms */
  SPAWN_DELAY: 500,
  /** Intermission duration between waves in ms */
  INTERMISSION_DURATION: 2000,
  /** Initial spawn delay at wave start in ms */
  INITIAL_SPAWN_DELAY: 1000,
  /** Difficulty multiplier per wave */
  DIFFICULTY_MULTIPLIER: 1.1,
} as const;

/**
 * Particle system configuration
 */
export const PARTICLE_CONFIG = {
  /** Maximum active particles */
  MAX_PARTICLES: 200,
  /** Default particle lifetime in seconds */
  DEFAULT_LIFETIME: 1,
  /** Default particle size */
  DEFAULT_SIZE: 4,
  /** Explosion particle count */
  EXPLOSION_COUNT: 15,
  /** Trail particle interval in ms */
  TRAIL_INTERVAL: 50,
} as const;

/**
 * UI configuration
 */
export const UI_CONFIG = {
  /** Score display position from top */
  SCORE_TOP: 40,
  /** Score display position from left */
  SCORE_LEFT: 20,
  /** Lives display position from right */
  LIVES_RIGHT: 20,
  /** Wave display horizontal offset */
  WAVE_OFFSET_X: 30,
  /** Life icon dimensions */
  LIFE_ICON_SIZE: 20,
  /** Font sizes */
  FONT_SIZE_SMALL: 12,
  FONT_SIZE_MEDIUM: 20,
  FONT_SIZE_LARGE: 24,
} as const;

/**
 * Colors used throughout the game
 */
export const COLORS = {
  /** Player ship color */
  PLAYER: '#4A90E2',
  /** Player bullet color */
  PLAYER_BULLET: '#4FC3F7',
  /** Enemy colors by type */
  ENEMY_BASIC: '#FF6B6B',
  ENEMY_DIVING: '#FFA726',
  ENEMY_SHOOTING: '#66BB6A',
  ENEMY_BOSS: '#AB47BC',
  /** UI colors */
  UI_TEXT: '#FFFFFF',
  UI_TEXT_DIM: '#888888',
  UI_BACKGROUND: 'rgba(0, 0, 0, 0.5)',
  /** Star color */
  STAR: '#FFFFFF',
} as const;

/**
 * Entity pool configuration
 */
export const POOL_CONFIG = {
  /** Initial enemy pool size */
  ENEMY_INITIAL_SIZE: 20,
  /** Maximum enemy pool size */
  ENEMY_MAX_SIZE: 50,
  /** Initial bullet pool size */
  BULLET_INITIAL_SIZE: 50,
  /** Maximum bullet pool size */
  BULLET_MAX_SIZE: 200,
} as const;

/**
 * Timing configuration
 */
export const TIMING_CONFIG = {
  /** Maximum delta time in ms (prevents physics explosions) */
  MAX_DELTA_TIME: 100,
  /** Target frames per second */
  TARGET_FPS: 60,
  /** Frame time in ms */
  FRAME_TIME: 1000 / 60,
} as const;
