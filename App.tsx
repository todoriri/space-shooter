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

// Import screens (to be created)
import { MenuScreen } from './src/screens/MenuScreen';
import { GameScreen } from './src/screens/GameScreen';
import { GameOverScreen } from './src/screens/GameOverScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';

// Create stack navigator
const Stack = createStackNavigator();

// Main App component
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const { gameState, resetGameState } = useGameState();

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
        // Implement game state saving
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
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Game">
              {(props) => (
                <GameScreen
                  {...props}
                  gameState={gameState}
                  onGameOver={(score, reason) => {
                    props.navigation.navigate('GameOver', { score, reason });
                  }}
                  onBackToMenu={() => props.navigation.navigate('Menu')}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="GameOver">
              {(props) => (
                <GameOverScreen
                  {...props}
                  score={props.route.params?.score || 0}
                  highScore={gameState.highScore}
                  reason={props.route.params?.reason}
                  onRestart={() => {
                    resetGameState();
                    props.navigation.replace('Game');
                  }}
                  onMenu={() => props.navigation.navigate('Menu')}
                />
              )}
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
