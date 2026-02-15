import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { GameEngine as RNGameEngine } from 'react-native-game-engine';
import { GameState, GameEvent, GameEntity, EntityType } from '../types';
import { MovementSystem } from './systems/MovementSystemV2';
import { CollisionSystem } from './systems/CollisionSystemV2';
import { PowerUpSystem } from './systems/PowerUpSystem';
import { AudioSystem, initializeAudioSystem } from './systems/AudioSystem';
import { WaveSystem } from './systems/WaveSystem';
import { ParticleSystem, handleParticleEvent, createBombEffect } from './systems/ParticleSystem';
import { RenderingSystem } from './systems/RenderingSystem';
import { PlayerSystem } from './systems/PlayerSystem';
import { TouchControls } from '../components/game/TouchControls';
import { createPlayerEntity } from './entities/Player';
import { createEnemyEntity, createEnemyWave, releaseEnemy } from './entities/Enemy';
import { createBulletEntity } from './entities/Bullet';
import { createPowerUpEntity, createRandomPowerUpDrop } from './entities/PowerUp';
import { StressTestSystem } from './systems/StressTestSystem';
import { audioLog } from '../utils/Debug';
import { performanceMonitor } from '../utils/PerformanceMonitor';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SpaceShooterGameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (reason: string) => void;
  onPause?: () => void;
  isPaused?: boolean;
  gameState: GameState;
  updateGameState: (updates: Partial<GameState>) => void;
  highScore: number;
  running?: boolean;
}

// Helper function: Create background stars
const createBackgroundStars = (count: number): GameEntity[] => {
  const stars: GameEntity[] = [];

  for (let i = 0; i < count; i++) {
    const starId = `star_${i}`;
    const x = Math.random() * SCREEN_WIDTH;
    const y = Math.random() * SCREEN_HEIGHT;
    const size = Math.random() * 3 + 1;
    const speed = Math.random() * 50 + 10;

    stars.push({
      id: starId,
      type: 'background' as EntityType,
      active: true,
      components: {
        position: {
          x,
          y,
          width: size,
          height: size,
          rotation: 0,
        },
        velocity: {
          x: 0,
          y: speed,
          maxSpeed: speed,
          acceleration: 0,
          friction: 0,
        },
        renderable: {
          visible: true,
          zIndex: 0,
          sprite: 'star',
          color: '#FFFFFF',
          alpha: Math.random() * 0.5 + 0.5,
        },
      },
      tags: ['background', 'star'],
    });
  }

  return stars;
};

export const SpaceShooterGame = React.forwardRef<any, SpaceShooterGameProps>(({
  onScoreUpdate,
  onGameOver,
  onPause,
  gameState,
  updateGameState,
  highScore,
  isPaused = false,
  running = true,
}, ref) => {
  const gameEngineRef = useRef<any>(null);

  // Expose engine methods via ref
  React.useImperativeHandle(ref, () => ({
    dispatch: (event: any) => gameEngineRef.current?.dispatch(event),
    publishEvent: (event: any) => gameEngineRef.current?.publishEvent(event),
  }));

  const inputRef = useRef({ move: { x: 0, y: 0 }, shooting: false, bomb: false });
  const isGameOverRef = useRef(false);

  // Initialize game entities synchronously
  const [entities, setEntities] = useState<Record<string, GameEntity>>(() => {
    const initialEntities: Record<string, GameEntity> = {};

    // Create player entity
    const player = createPlayerEntity({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 100 });
    initialEntities[player.id] = player;

    // Create background stars
    const stars = createBackgroundStars(50);
    stars.forEach(star => {
      initialEntities[star.id] = star;
    });

    // Create wave manager entity
    const initialWaveConfig = { enemyCount: 5 }; // Default for wave 1
    initialEntities['waveManager'] = {
      id: 'waveManager',
      type: EntityType.SYSTEM,
      active: true,
      tags: ['system'],
      components: {
        waveManager: {
          currentWave: gameState.currentWave,
          waveComplete: false,
          enemiesRemaining: 0,
          enemiesToSpawn: 5, // Let WaveSystem handle spawning
          lastSpawnTime: 0,
          isBossWave: false,
          bossSpawned: false,
          bossDefeated: false,
          spawnTimer: 0,
          waveStartTime: Date.now(),
        }
      }
    };

    return initialEntities;
  });

  const [systems, setSystems] = useState<any[]>([]);
  const [isStressTestEnabled, setIsStressTestEnabled] = useState(false);
  const isStressTestEnabledRef = useRef(false);

  const toggleStressTest = () => {
    isStressTestEnabledRef.current = !isStressTestEnabledRef.current;
    setIsStressTestEnabled(isStressTestEnabledRef.current);
  };

  // Initialize audio system
  useEffect(() => {
    const initAudio = async () => {
      try {
        await initializeAudioSystem();
        audioLog.log('Audio system initialized');
      } catch (error) {
        audioLog.error('Failed to initialize audio system:', error);
      }
    };

    initAudio();

    // Cleanup on unmount
    return () => {
      // Audio cleanup would go here
    };
  }, []);

  // Initialize game systems
  useEffect(() => {
    const initialSystems = [
      // Player system - handles input, movement, and shooting (MUST BE BEFORE MOVEMENT)
      (entities: Record<string, GameEntity>, { time, dispatch }: { time: { current: number }, dispatch: (event: any) => void }) => {
        return PlayerSystem(entities, { time, dispatch, input: inputRef.current });
      },

      // Movement system - handles position updates and touch controls
      (entities: Record<string, GameEntity>, { time }: { time: { delta: number; current: number } }) => {
        return MovementSystem(entities, { time });
      },

      // Collision system - handles collision detection and resolution
      (entities: Record<string, GameEntity>, { time, dispatch }: {
        time: { current: number };
        dispatch: (event: any) => void
      }) => {
        return CollisionSystem(entities, { time, dispatch });
      },

      // Power-up system - handles power-up effects and duration tracking
      (entities: Record<string, GameEntity>, { time, dispatch }: {
        time: { current: number };
        dispatch: (event: any) => void
      }) => {
        return PowerUpSystem(entities, { time, dispatch });
      },

      // Audio system - handles game audio and sound effects
      (entities: Record<string, GameEntity>, { dispatch, events }: {
        dispatch: (event: any) => void;
        events?: any[]
      }) => {
        return AudioSystem(entities, { dispatch, events });
      },

      // Wave system - handles enemy wave progression and spawning
      (entities: Record<string, GameEntity>, { time, dispatch }: {
        time: { current: number };
        dispatch: (event: any) => void
      }) => {
        return WaveSystem(entities, { time, dispatch });
      },

      // Particle system - handles visual effects and particles
      (entities: Record<string, GameEntity>, { time, dispatch, events }: {
        time: { current: number };
        dispatch: (event: any) => void;
        events: any[];
      }) => {
        return ParticleSystem(entities, { time, dispatch, events } as any);
      },

      // Stress Test System (Dev only or hidden)
      (entities: Record<string, GameEntity>, { time }: { time: { delta: number } }) => {
        return StressTestSystem(entities, {
          time,
          screen: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
          enabled: isStressTestEnabledRef.current
        });
      },

      // Cleanup system - removes off-screen entities
      (entities: Record<string, GameEntity>) => {
        return handleCleanup(entities);
      },

      // Performance Monitor System - Updates metrics
      (entities: Record<string, GameEntity>) => {
        performanceMonitor.updateGameMetrics({
          entityCount: Object.keys(entities).length
        });
        return entities;
      },
    ];
    setSystems(initialSystems);
  }, []);

  // Handle game events
  const handleEvent = (event: GameEvent) => {
    switch (event.type) {
      case 'playerShoot':
        // Handled by systems
        break;
      case 'playerBomb':
        // Handled by PlayerSystem directly now
        break;
      case 'enemyShoot':
        // Handled by systems
        break;
      case 'collision':
        // Handled by systems
        break;
      case 'powerUpCollect':
        // Handled by systems
        break;
      case 'enemyDestroyed':
        if (event.data?.points) {
          const newScore = gameState.score + event.data.points;
          const newHighScore = Math.max(newScore, highScore);

          updateGameState({
            score: newScore,
            highScore: newHighScore
          });

          onScoreUpdate?.(newScore);
        }
        break;
      case 'playerHit':
        const newLives = gameState.lives - 1;
        updateGameState({ lives: newLives });
        if (newLives <= 0) {
          if (!isGameOverRef.current) {
            isGameOverRef.current = true;
            onGameOver?.(event.data?.reason || 'noLives');
          }
        }
        break;
      case 'gameOver':
        if (!isGameOverRef.current) {
          isGameOverRef.current = true;
          onGameOver?.(event.data?.reason || 'unknown');
        }
        break;
      case 'waveComplete':
        // Update game state for UI ONLY
        const nextWave = gameState.currentWave + 1;
        updateGameState({ currentWave: nextWave });
        break;
      case 'bossSpawn':
        // UI notification handled by component
        break;
    }
  };

  // Handle player movement from touch controls
  const handlePlayerMove = (direction: { x: number; y: number }) => {
    if (!gameEngineRef.current || isPaused) return;

    // Update input state for PlayerSystem
    // TouchControls now sends 1:1 delta, so we directly add
    inputRef.current.move.x += direction.x;
    inputRef.current.move.y += direction.y;
  };

  // Handle bomb action from touch controls
  const handleBomb = () => {
    if (isPaused) return;
    inputRef.current.bomb = true;
  };

  // Helper function: Clean up off-screen entities
  const handleCleanup = (entities: Record<string, GameEntity>): Record<string, GameEntity> => {
    const updatedEntities = { ...entities };

    Object.keys(updatedEntities).forEach(id => {
      const entity = updatedEntities[id];
      const position = entity.components.position;

      if (!position) return;

      // Handle background stars wrapping
      if (entity.tags?.includes('background')) {
        if (position.y > SCREEN_HEIGHT) {
          position.y = -(position.height || 0); // Wrap to top
          position.x = Math.random() * SCREEN_WIDTH; // Randomize X for variety
        }
        return;
      }

      // Remove other entities that are off-screen
      const isOffScreen =
        position.y > SCREEN_HEIGHT + 100 || // Below screen
        position.y < -100 || // Above screen
        position.x < -100 || // Left of screen
        position.x > SCREEN_WIDTH + 100; // Right of screen

      if (isOffScreen && entity.type !== EntityType.PLAYER && !entity.tags?.includes('system')) {
        if (entity.type === EntityType.ENEMY) {
          releaseEnemy(entity);
        }
        delete updatedEntities[id];
      }
    });

    return updatedEntities;
  };

  // Helper function: Handle player shooting
  const handlePlayerShoot = (isShooting: boolean) => {
    inputRef.current.shooting = isShooting;
  };


  return (
    <View style={styles.container}>
      <RNGameEngine
        ref={gameEngineRef}
        style={styles.gameEngine}
        systems={systems}
        entities={entities}
        running={running}
        onEvent={handleEvent}
        renderer={RenderingSystem}
      />

      {/* UI Overlay removed - handled by GameScreen */}

      {/* Touch Controls */}
      <TouchControls
        onMove={handlePlayerMove}
        onShoot={handlePlayerShoot}
        onBomb={handleBomb}
        onPause={onPause}
        isPaused={isPaused}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gameEngine: {
    flex: 1,
  },
  uiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20, // Ensure UI is on top of game layer and TouchControls (if TouchControls zIndex < 20)
    pointerEvents: 'box-none',
  },
  scoreContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    alignItems: 'flex-start',
  },
  scoreLabel: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  scoreValue: {
    color: '#FFF',
    fontSize: 24,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  livesContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lifeIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#4FC3F7',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  waveContainer: {
    position: 'absolute',
    top: 40,
    left: '50%',
    transform: [{ translateX: -30 }],
    alignItems: 'center',
  },
  waveLabel: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  waveValue: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  devButton: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FF0000',
  },
  devText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  devTextActive: {
    color: '#00FF00',
  },
});