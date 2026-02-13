import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

// Import game systems
import { useGameState } from './src/game/GameState';
import { assetManager } from './src/utils/AssetManager';
import { performanceMonitor } from './src/utils/PerformanceMonitor';

import { mobileLifecycleManager } from './src/utils/MobileLifecycleManager';
import { loadHighScore, saveHighScore, loadGameSettings, GameSettings } from './src/utils/storage';
import { GameAudio } from './src/utils/AudioManager';

// Import screens (to be created)
import { MenuScreen } from './src/screens/MenuScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { GameScreen } from './src/screens/GameScreen';
import { GameOverScreen } from './src/screens/GameOverScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';

// Create stack navigator
const Stack = createStackNavigator();

// Main App component
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const { gameState, updateGameState, resetGameState, togglePause } = useGameState();

  // Initialize game systems on mount
  useEffect(() => {
    initializeGame();

    // Cleanup on unmount
    return () => {
      cleanupGame();
    };
  }, []);

  // Initialize all game systems
  const initializeGame = async () => {
    console.log('Initializing Space Shooter game...');

    try {
      // 1. Initialize mobile lifecycle manager
      mobileLifecycleManager.initialize();

      // 2. Start performance monitoring
      performanceMonitor.startMonitoring();

      // 3. Load essential assets with progress tracking
      await assetManager.loadEssentialAssets();

      // 4. Preload remaining assets in background
      assetManager.preloadAssets('game');

      // 5. Set up lifecycle callbacks
      setupLifecycleCallbacks();

      // 6. Load settings and apply audio config
      const settings: GameSettings = await loadGameSettings();
      GameAudio.setGameVolumes(
        settings.musicEnabled ? 1.0 : 0.0,
        settings.soundEnabled ? 1.0 : 0.0,
        settings.soundEnabled ? 1.0 : 0.0
      );

      // 7. Load high score
      const loadedHighScore = await loadHighScore();
      updateGameState({ highScore: loadedHighScore });

      console.log('Game initialization complete');
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize game:', error);
      // Still show the game even if some systems failed
      setIsLoading(false);
    }
  };

  // Setup lifecycle callbacks
  const setupLifecycleCallbacks = () => {
    mobileLifecycleManager.registerCallback({
      onGamePause: () => {
        console.log('Game paused by lifecycle manager');
        // Pause game logic, audio, etc.
      },
      onGameResume: () => {
        console.log('Game resumed by lifecycle manager');
        // Resume game logic, audio, etc.
      },
      onLowMemoryWarning: () => {
        console.warn('Low memory warning - cleaning up assets');
        assetManager.cleanupOldAssets(['player_ship', 'background']);
      },
      onSaveGameState: async () => {
        // Save game state when app backgrounds
        console.log('Auto-saving game state...');
        if (gameState.highScore > 0) {
          await saveHighScore(gameState.highScore);
        }
      },
    });
  };

  // Cleanup game systems
  const cleanupGame = () => {
    console.log('Cleaning up game systems...');

    performanceMonitor.stopMonitoring();
    mobileLifecycleManager.cleanup();
    assetManager.clearAll();
  };

  // Handle game over navigation
  const handleGameOver = (score: number, reason?: string) => {
    // Navigate to game over screen
    console.log(`Game over - Score: ${score}, Reason: ${reason}`);

    // Save high score if changed
    if (score >= gameState.highScore) {
      saveHighScore(score);
    }
  };

  // Show loading screen while initializing
  if (isLoading) {
    return <LoadingScreen progress={loadProgress} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <View style={styles.container}>
          <Stack.Navigator
            initialRouteName="Menu"
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: 'transparent' },
              animationEnabled: true,
            }}
          >
            <Stack.Screen name="Menu">
              {(props) => (
                <MenuScreen
                  {...props}
                  highScore={gameState.highScore}
                  onStartGame={() => props.navigation.navigate('Game')}
                  onSettings={() => props.navigation.navigate('Settings')}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Game">
              {(props) => (
                <GameScreen
                  {...props}
                  gameState={gameState}
                  updateGameState={updateGameState}
                  togglePause={togglePause}
                  onGameOver={(score, reason) => {
                    handleGameOver(score, reason);
                    props.navigation.navigate('GameOver', { score, reason });
                  }}
                  onBackToMenu={() => props.navigation.navigate('Menu')}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Settings">
              {(props) => (
                <SettingsScreen
                  {...props}
                  navigation={props.navigation}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="GameOver">
              {(props) => {
                const params = props.route.params as any;
                return (
                  <GameOverScreen
                    {...props}
                    score={params?.score || 0}
                    highScore={gameState.highScore}
                    reason={params?.reason}
                    onRestart={() => {
                      resetGameState();
                      props.navigation.replace('Game');
                    }}
                    onMenu={() => props.navigation.navigate('Menu')}
                  />
                );
              }}
            </Stack.Screen>
          </Stack.Navigator>
        </View>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

// Export for testing
export { App };
