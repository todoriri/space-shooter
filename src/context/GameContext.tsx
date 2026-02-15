/**
 * Game Context Provider
 * Centralized state management for the Space Shooter game.
 * Consolidates state that was previously split across useState, useRef, and props.
 */

import React, { createContext, useContext, useReducer, useRef, useCallback, ReactNode } from 'react';
import { GameState } from '../types';

// Action types for the reducer
type GameAction =
  | { type: 'UPDATE_SCORE'; payload: number }
  | { type: 'UPDATE_LIVES'; payload: number }
  | { type: 'UPDATE_WAVE'; payload: number }
  | { type: 'SET_HIGH_SCORE'; payload: number }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'SET_SCREEN'; payload: GameState['currentScreen'] }
  | { type: 'SET_GAME_OVER_REASON'; payload: GameState['gameOverReason'] }
  | { type: 'SET_DIFFICULTY'; payload: GameState['difficulty'] }
  | { type: 'UPDATE_GAME_TIME'; payload: number }
  | { type: 'UPDATE_SPAWN_TIME'; payload: number }
  | { type: 'ADD_POWER_UP'; payload: string }
  | { type: 'REMOVE_POWER_UP'; payload: string }
  | { type: 'CLEAR_POWER_UPS' }
  | { type: 'RESET_GAME' }
  | { type: 'BATCH_UPDATE'; payload: Partial<GameState> };

// Initial game state
const initialGameState: GameState = {
  currentScreen: 'menu',
  score: 0,
  lives: 3,
  currentWave: 1,
  highScore: 0,
  isPaused: false,
  gameTime: 0,
  difficulty: 'medium',
  playerPowerUps: [],
  gameOverReason: undefined,
  lastSpawnTime: 0,
};

// Reducer function for state updates
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'UPDATE_SCORE':
      return {
        ...state,
        score: action.payload,
        highScore: Math.max(state.highScore, action.payload),
      };
    case 'UPDATE_LIVES':
      return {
        ...state,
        lives: Math.max(0, action.payload),
      };
    case 'UPDATE_WAVE':
      return {
        ...state,
        currentWave: action.payload,
      };
    case 'SET_HIGH_SCORE':
      return {
        ...state,
        highScore: action.payload,
      };
    case 'SET_PAUSED':
      return {
        ...state,
        isPaused: action.payload,
      };
    case 'SET_SCREEN':
      return {
        ...state,
        currentScreen: action.payload,
      };
    case 'SET_GAME_OVER_REASON':
      return {
        ...state,
        gameOverReason: action.payload,
        currentScreen: action.payload ? 'gameOver' : state.currentScreen,
      };
    case 'SET_DIFFICULTY':
      return {
        ...state,
        difficulty: action.payload,
      };
    case 'UPDATE_GAME_TIME':
      return {
        ...state,
        gameTime: action.payload,
      };
    case 'UPDATE_SPAWN_TIME':
      return {
        ...state,
        lastSpawnTime: action.payload,
      };
    case 'ADD_POWER_UP':
      if (state.playerPowerUps.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        playerPowerUps: [...state.playerPowerUps, action.payload],
      };
    case 'REMOVE_POWER_UP':
      return {
        ...state,
        playerPowerUps: state.playerPowerUps.filter(p => p !== action.payload),
      };
    case 'CLEAR_POWER_UPS':
      return {
        ...state,
        playerPowerUps: [],
      };
    case 'RESET_GAME':
      return {
        ...initialGameState,
        highScore: state.highScore, // Preserve high score
      };
    case 'BATCH_UPDATE':
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
}

// Input state interface
interface InputState {
  move: { x: number; y: number };
  shooting: boolean;
  bomb: boolean;
}

// Context value interface
interface GameContextValue {
  // Game state
  gameState: GameState;

  // State updaters
  updateScore: (points: number) => void;
  updateLives: (lives: number) => void;
  updateWave: (wave: number) => void;
  setHighScore: (score: number) => void;
  setPaused: (paused: boolean) => void;
  setScreen: (screen: GameState['currentScreen']) => void;
  setGameOverReason: (reason: GameState['gameOverReason']) => void;
  setDifficulty: (difficulty: GameState['difficulty']) => void;
  updateGameTime: (time: number) => void;
  updateSpawnTime: (time: number) => void;
  addPowerUp: (powerUp: string) => void;
  removePowerUp: (powerUp: string) => void;
  clearPowerUps: () => void;
  resetGame: () => void;
  batchUpdate: (updates: Partial<GameState>) => void;

  // Input state (using ref for performance - avoids re-renders on every input)
  inputRef: React.MutableRefObject<InputState>;
  isGameOverRef: React.MutableRefObject<boolean>;

  // Reset input state
  resetInput: () => void;
}

// Create context
const GameContext = createContext<GameContextValue | undefined>(undefined);

// Provider props
interface GameProviderProps {
  children: ReactNode;
  initialHighScore?: number;
  initialDifficulty?: GameState['difficulty'];
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (reason: string) => void;
  onWaveComplete?: (wave: number) => void;
}

/**
 * GameProvider Component
 * Wraps the game with centralized state management
 */
export const GameProvider: React.FC<GameProviderProps> = ({
  children,
  initialHighScore = 0,
  initialDifficulty = 'medium',
  onScoreUpdate,
  onGameOver,
  onWaveComplete,
}) => {
  const [gameState, dispatch] = useReducer(gameReducer, {
    ...initialGameState,
    highScore: initialHighScore,
    difficulty: initialDifficulty,
  });

  // Refs for high-frequency state that shouldn't trigger re-renders
  const inputRef = useRef<InputState>({
    move: { x: 0, y: 0 },
    shooting: false,
    bomb: false,
  });
  const isGameOverRef = useRef(false);

  // State updaters
  const updateScore = useCallback((points: number) => {
    dispatch({ type: 'UPDATE_SCORE', payload: points });
    onScoreUpdate?.(points);
  }, [onScoreUpdate]);

  const updateLives = useCallback((lives: number) => {
    dispatch({ type: 'UPDATE_LIVES', payload: lives });
    if (lives <= 0 && !isGameOverRef.current) {
      isGameOverRef.current = true;
      dispatch({ type: 'SET_GAME_OVER_REASON', payload: 'noLives' });
      onGameOver?.('noLives');
    }
  }, [onGameOver]);

  const updateWave = useCallback((wave: number) => {
    dispatch({ type: 'UPDATE_WAVE', payload: wave });
    onWaveComplete?.(wave);
  }, [onWaveComplete]);

  const setHighScore = useCallback((score: number) => {
    dispatch({ type: 'SET_HIGH_SCORE', payload: score });
  }, []);

  const setPaused = useCallback((paused: boolean) => {
    dispatch({ type: 'SET_PAUSED', payload: paused });
  }, []);

  const setScreen = useCallback((screen: GameState['currentScreen']) => {
    dispatch({ type: 'SET_SCREEN', payload: screen });
  }, []);

  const setGameOverReason = useCallback((reason: GameState['gameOverReason']) => {
    dispatch({ type: 'SET_GAME_OVER_REASON', payload: reason });
    if (reason) {
      isGameOverRef.current = true;
      onGameOver?.(reason);
    }
  }, [onGameOver]);

  const setDifficulty = useCallback((difficulty: GameState['difficulty']) => {
    dispatch({ type: 'SET_DIFFICULTY', payload: difficulty });
  }, []);

  const updateGameTime = useCallback((time: number) => {
    dispatch({ type: 'UPDATE_GAME_TIME', payload: time });
  }, []);

  const updateSpawnTime = useCallback((time: number) => {
    dispatch({ type: 'UPDATE_SPAWN_TIME', payload: time });
  }, []);

  const addPowerUp = useCallback((powerUp: string) => {
    dispatch({ type: 'ADD_POWER_UP', payload: powerUp });
  }, []);

  const removePowerUp = useCallback((powerUp: string) => {
    dispatch({ type: 'REMOVE_POWER_UP', payload: powerUp });
  }, []);

  const clearPowerUps = useCallback(() => {
    dispatch({ type: 'CLEAR_POWER_UPS' });
  }, []);

  const resetGame = useCallback(() => {
    isGameOverRef.current = false;
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const batchUpdate = useCallback((updates: Partial<GameState>) => {
    dispatch({ type: 'BATCH_UPDATE', payload: updates });
  }, []);

  const resetInput = useCallback(() => {
    inputRef.current = {
      move: { x: 0, y: 0 },
      shooting: false,
      bomb: false,
    };
  }, []);

  const value: GameContextValue = {
    gameState,
    updateScore,
    updateLives,
    updateWave,
    setHighScore,
    setPaused,
    setScreen,
    setGameOverReason,
    setDifficulty,
    updateGameTime,
    updateSpawnTime,
    addPowerUp,
    removePowerUp,
    clearPowerUps,
    resetGame,
    batchUpdate,
    inputRef,
    isGameOverRef,
    resetInput,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

/**
 * Custom hook to access game context
 * @throws Error if used outside of GameProvider
 */
export const useGameContext = (): GameContextValue => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

/**
 * Custom hook for game state only (for components that only need to read state)
 */
export const useGameState = (): GameState => {
  const { gameState } = useGameContext();
  return gameState;
};

/**
 * Custom hook for input state (for systems that process input)
 */
export const useGameInput = () => {
  const { inputRef, resetInput } = useGameContext();
  return { input: inputRef.current, resetInput };
};

export default GameContext;
