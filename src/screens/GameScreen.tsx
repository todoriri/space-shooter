// Game screen component - main gameplay screen
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  BackHandler,
} from 'react-native';
import { GameState as GameStateType } from '../types';
import { SpaceShooterGame } from '../game/GameEngine';
import { useGameState } from '../game/GameState';
import { assetManager } from '../utils/AssetManager';
import { performanceMonitor } from '../utils/PerformanceMonitor';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GameScreenProps {
  gameState: GameStateType;
  updateGameState: (updates: Partial<GameStateType>) => void;
  togglePause: () => void;
  onGameOver: (score: number, reason?: string) => void;
  onBackToMenu: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  gameState,
  updateGameState,
  togglePause,
  onGameOver,
  onBackToMenu,
}) => {
  // Local state for UI only (if needed), but we rely on gameState.isPaused
  // const [isPaused, setIsPaused] = useState(false); <- REMOVED

  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const gameEngineRef = useRef<any>(null);

  // Sync local pause menu state with global pause state
  useEffect(() => {
    setShowPauseMenu(gameState.isPaused);
  }, [gameState.isPaused]);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => backHandler.remove();
  }, [gameState.isPaused]);

  const handleBackPress = () => {
    if (!gameState.isPaused) {
      togglePause();
      // setIsPaused(true); <- REMOVED
      // setShowPauseMenu(true); <- Handled by useEffect
      return true;
    }
    return false;
  };

  const [isRunning, setIsRunning] = useState(true);

  // Handle score updates
  const handleScoreUpdate = (score: number) => {
    updateGameState({ score });
  };

  // Handle game over
  const handleGameOver = (reason: string) => {
    console.log(`Game over: ${reason}`);
    setIsRunning(false); // Stop the game engine
    onGameOver(gameState.score, reason);
  };

  // Handle pause
  const handlePause = () => {
    if (!gameState.isPaused && isRunning) {
      togglePause();
    }
  };

  // Handle resume
  const handleResume = () => {
    if (gameState.isPaused) {
      togglePause();
    }
  };

  // Handle quit to menu
  const handleQuit = () => {
    // Play sound effect
    assetManager.playSound('button_click');

    // Ensure we unpause before leaving, or handle reset
    if (gameState.isPaused) togglePause();
    setIsRunning(false);

    // Navigate back to menu
    onBackToMenu();
  };

  // Play sound effect
  const playSound = (soundKey: string) => {
    assetManager.playSound(soundKey);
  };

  return (
    <View style={styles.container}>
      {/* Game Engine */}
      <SpaceShooterGame
        ref={gameEngineRef}
        onScoreUpdate={handleScoreUpdate}
        onGameOver={handleGameOver}
        onPause={handlePause}
        isPaused={gameState.isPaused}
        running={isRunning && !gameState.isPaused}
        gameState={gameState}
        updateGameState={updateGameState}
        highScore={gameState.highScore}
      />

      {/* Game HUD Overlay */}
      {!gameState.isPaused && (
        <View style={styles.hudContainer}>
          {/* Score Display */}
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreValue}>{gameState.score.toLocaleString()}</Text>
          </View>

          {/* Lives Display */}
          <View style={styles.livesContainer}>
            <Text style={styles.livesLabel}>LIVES</Text>
            <View style={styles.livesIcons}>
              {Array.from({ length: gameState.lives }).map((_, index) => (
                <Text key={index} style={styles.lifeIcon}>❤️</Text>
              ))}
            </View>
          </View>

          {/* Wave Display */}
          <View style={styles.waveContainer}>
            <Text style={styles.waveLabel}>WAVE</Text>
            <Text style={styles.waveValue}>{gameState.currentWave}</Text>
          </View>

          {/* Pause Button removed - handled by TouchControls */}
        </View>
      )}

      {/* Pause Menu Overlay */}
      {gameState.isPaused && (
        <View style={styles.pauseMenuOverlay}>
          <View style={styles.pauseMenuContainer}>
            <Text style={styles.pauseMenuTitle}>GAME PAUSED</Text>

            <View style={styles.pauseMenuStats}>
              <Text style={styles.pauseMenuStat}>Score: {gameState.score.toLocaleString()}</Text>
              <Text style={styles.pauseMenuStat}>Wave: {gameState.currentWave}</Text>
              <Text style={styles.pauseMenuStat}>Lives: {gameState.lives}</Text>
            </View>

            <View style={styles.pauseMenuButtons}>
              <TouchableOpacity style={styles.pauseMenuButton} onPress={handleResume}>
                <Text style={styles.pauseMenuButtonText}>RESUME</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pauseMenuButton} onPress={handleQuit}>
                <Text style={styles.pauseMenuButtonText}>QUIT TO MENU</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.pauseMenuHint}>
              Press back button or pause button to resume
            </Text>
          </View>
        </View>
      )}

      {/* Performance Debug (Development only) */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            FPS: {Math.round(performanceMonitor.getMetrics().fps)}
          </Text>
          <Text style={styles.debugText}>
            Entities: {performanceMonitor.getMetrics().entityCount}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  hudContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#ffffff',
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ffff',
  },
  livesContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  livesLabel: {
    fontSize: 12,
    color: '#ffffff',
    marginBottom: 5,
  },
  livesIcons: {
    flexDirection: 'row',
  },
  lifeIcon: {
    fontSize: 20,
    marginHorizontal: 2,
  },
  waveContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  waveLabel: {
    fontSize: 12,
    color: '#ffffff',
    marginBottom: 2,
  },
  waveValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffaa00',
  },
  pauseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButtonText: {
    fontSize: 24,
  },
  pauseMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 100, // Important for Android overlay
  },
  pauseMenuContainer: {
    backgroundColor: 'rgba(20, 20, 40, 0.9)',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    width: '80%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#00ffff',
  },
  pauseMenuTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ffff',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  pauseMenuStats: {
    marginBottom: 30,
    alignItems: 'center',
  },
  pauseMenuStat: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 8,
  },
  pauseMenuButtons: {
    width: '100%',
  },
  pauseMenuButton: {
    backgroundColor: '#00aaff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  pauseMenuButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  pauseMenuHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 20,
    textAlign: 'center',
  },
  debugContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 5,
  },
  debugText: {
    fontSize: 10,
    color: '#00ff00',
    fontFamily: 'monospace',
  },
});

export default GameScreen;