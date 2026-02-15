import { useState, useCallback } from 'react';
import { GameState as GameStateType } from '../types';

const INITIAL_GAME_STATE: GameStateType = {
  currentScreen: 'menu',
  score: 0,
  highScore: 0,
  lives: 3,
  currentWave: 1,
  isPaused: false,
  gameTime: 0,
  difficulty: 'medium',
  playerPowerUps: [],
  lastSpawnTime: 0, // Added initialization
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameStateType>(INITIAL_GAME_STATE);

  const updateGameState = useCallback((updates: Partial<GameStateType>) => {
    setGameState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetGameState = useCallback(() => {
    setGameState({
      ...INITIAL_GAME_STATE,
      highScore: gameState.highScore, // Preserve high score
    });
  }, [gameState.highScore]);

  const addScore = useCallback((points: number) => {
    setGameState(prev => {
      const newScore = prev.score + points;
      const newHighScore = Math.max(newScore, prev.highScore);
      return {
        ...prev,
        score: newScore,
        highScore: newHighScore,
      };
    });
  }, []);

  const loseLife = useCallback(() => {
    setGameState(prev => {
      const newLives = prev.lives - 1;
      return {
        ...prev,
        lives: newLives,
      };
    });
  }, []);

  const gainLife = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      lives: Math.min(prev.lives + 1, 5), // Max 5 lives
    }));
  }, []);

  const addPowerUp = useCallback((powerUp: string) => {
    setGameState(prev => ({
      ...prev,
      playerPowerUps: [...prev.playerPowerUps, powerUp],
    }));
  }, []);

  const removePowerUp = useCallback((powerUp: string) => {
    setGameState(prev => ({
      ...prev,
      playerPowerUps: prev.playerPowerUps.filter(p => p !== powerUp),
    }));
  }, []);

  const setScreen = useCallback((screen: GameStateType['currentScreen']) => {
    setGameState(prev => ({ ...prev, currentScreen: screen }));
  }, []);

  const togglePause = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const setDifficulty = useCallback((difficulty: GameStateType['difficulty']) => {
    setGameState(prev => ({ ...prev, difficulty }));
  }, []);

  const completeWave = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentWave: prev.currentWave + 1,
    }));
  }, []);

  return {
    gameState,
    updateGameState,
    resetGameState,
    addScore,
    loseLife,
    gainLife,
    addPowerUp,
    removePowerUp,
    setScreen,
    togglePause,
    setDifficulty,
    completeWave,
  };
};

// Game constants
export const GAME_CONSTANTS = {
  PLAYER: {
    INITIAL_LIVES: 3,
    MAX_LIVES: 5,
    INITIAL_HEALTH: 100,
    SPEED: 5,
    SHOOT_COOLDOWN: 300, // ms
  },
  ENEMY: {
    BASIC: {
      HEALTH: 30,
      DAMAGE: 10,
      POINTS: 100,
      SPEED: 2,
    },
    DIVING: {
      HEALTH: 50,
      DAMAGE: 15,
      POINTS: 200,
      SPEED: 3,
    },
    SHOOTING: {
      HEALTH: 40,
      DAMAGE: 20,
      POINTS: 150,
      SPEED: 1.5,
    },
    BOSS: {
      HEALTH: 500,
      DAMAGE: 30,
      POINTS: 1000,
      SPEED: 1,
    },
  },
  BULLET: {
    PLAYER: {
      DAMAGE: 25,
      SPEED: 10,
    },
    ENEMY: {
      DAMAGE: 20,
      SPEED: 8,
    },
  },
  POWER_UP: {
    DURATION: {
      SHIELD: 10000, // 10 seconds
      RAPID_FIRE: 8000, // 8 seconds
      MULTI_SHOT: 12000, // 12 seconds
    },
  },
  WAVE: {
    ENEMY_COUNT_MULTIPLIER: 1.2,
    ENEMY_SPEED_MULTIPLIER: 1.1,
    SPAWN_INTERVAL: 1000, // ms
  },
  SCREEN: {
    WIDTH: 0, // Will be set dynamically
    HEIGHT: 0, // Will be set dynamically
  },
};