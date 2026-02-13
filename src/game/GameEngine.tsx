import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { GameEngine as RNGameEngine } from 'react-native-game-engine';
import { GameState, GameEvent, GameEntity, EntityType } from '../types';
import { MovementSystem } from './systems/MovementSystemV2';
import { CollisionSystem } from './systems/CollisionSystemV2';
import { PowerUpSystem } from './systems/PowerUpSystem';
import { AudioSystem, initializeAudioSystem } from './systems/AudioSystem';
import { WaveSystem } from './systems/WaveSystem';
import { ParticleSystem, handleParticleEvent } from './systems/ParticleSystem';
import { RenderingSystem } from './systems/RenderingSystem';
import { PlayerSystem } from './systems/PlayerSystem';
import { TouchControls } from '../components/game/TouchControls';
import { createPlayerEntity } from './entities/Player';
import { createEnemyEntity, createEnemyWave } from './entities/Enemy';
import { createBulletEntity } from './entities/Bullet';
import { createPowerUpEntity, createRandomPowerUpDrop } from './entities/PowerUp';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SpaceShooterGameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (reason: string) => void;
  onPause?: () => void;
  isPaused?: boolean;
  gameState: GameState;
  updateGameState: (updates: Partial<GameState>) => void;
  highScore: number;
}

export const SpaceShooterGame = React.forwardRef<any, SpaceShooterGameProps>(({
  onScoreUpdate,
  onGameOver,
  onPause,
  gameState,
  updateGameState,
  highScore,
  isPaused = false,
}, ref) => {
  const gameEngineRef = useRef<any>(null);

  // Expose engine methods via ref
  React.useImperativeHandle(ref, () => ({
    dispatch: (event: any) => gameEngineRef.current?.dispatch(event),
    publishEvent: (event: any) => gameEngineRef.current?.publishEvent(event),
  }));

  const inputRef = useRef({ move: { x: 0, y: 0 }, shooting: false, bomb: false });
  const [entities, setEntities] = useState<Record<string, GameEntity>>({});
  const [systems, setSystems] = useState<any[]>([]);

  // Initialize audio system
  useEffect(() => {
    const initAudio = async () => {
      try {
        await initializeAudioSystem();
        console.log('Audio system initialized');
      } catch (error) {
        console.error('Failed to initialize audio system:', error);
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
      (entities: Record<string, GameEntity>, { time }: { time: { delta: number } }) => {
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
      (entities: Record<string, GameEntity>, { time, dispatch }: {
        time: { current: number };
        dispatch: (event: any) => void
      }) => {
        return ParticleSystem(entities, { time, dispatch });
      },

      // Cleanup system - removes off-screen entities
      (entities: Record<string, GameEntity>) => {
        return handleCleanup(entities);
      },
    ];
    setSystems(initialSystems);
  }, []);

  // Initialize game entities
  useEffect(() => {
    const initialEntities: Record<string, GameEntity> = {};

    // Create player entity
    const player = createPlayerEntity({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 100 });
    initialEntities[player.id] = player;

    // Create initial enemy wave
    const enemies = createEnemyWave(gameState.currentWave, SCREEN_WIDTH);
    enemies.forEach(enemy => {
      initialEntities[enemy.id] = enemy;
    });

    // Create background stars
    const stars = createBackgroundStars(50);
    stars.forEach(star => {
      initialEntities[star.id] = star;
    });

    // Create wave manager entity
    initialEntities['waveManager'] = {
      id: 'waveManager',
      type: EntityType.SYSTEM,
      active: true,
      tags: ['system'],
      components: {
        waveManager: {
          currentWave: gameState.currentWave,
          waveComplete: false,
          enemiesRemaining: enemies.length,
          lastSpawnTime: 0,
          isBossWave: false,
          bossSpawned: false,
          bossDefeated: false,
          spawnTimer: 0,
          waveStartTime: Date.now(),
        }
      }
    };

    setEntities(initialEntities);
  }, [gameState.currentWave]);

  // Handle game events
  const handleEvent = (event: GameEvent) => {
    console.log('Game event:', event);

    // Handle particle effects for visual events
    setEntities(currentEntities => {
      return handleParticleEvent(event, currentEntities);
    });

    switch (event.type) {
      case 'playerShoot':
        // TODO: Handle player shooting
        break;
      case 'enemyShoot':
        // TODO: Handle enemy shooting
        break;
      case 'collision':
        // TODO: Handle collision
        break;
      case 'powerUpCollect':
        // TODO: Handle power-up collection
        break;
      case 'enemyDestroyed':
        // TODO: Handle enemy destruction
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
        // TODO: Handle player hit
        const newLives = gameState.lives - 1;
        updateGameState({ lives: newLives });
        if (newLives <= 0) {
          onGameOver?.('noLives');
        }
        break;
      case 'gameOver':
        onGameOver?.(event.data?.reason || 'unknown');
        break;
      case 'waveComplete':
        // TODO: Handle wave completion
        updateGameState({ currentWave: gameState.currentWave + 1 });
        break;
      case 'bossSpawn':
        // TODO: Handle boss spawn
        break;
    }
  };

  // Handle player movement from touch controls
  // Handle player movement from touch controls
  const handlePlayerMove = (direction: { x: number; y: number }) => {
    if (!gameEngineRef.current || isPaused) return;

    // Update input state for PlayerSystem
    inputRef.current.move.x += direction.x * 20;
    inputRef.current.move.y += direction.y * 20;
  };

  // Handle bomb action from touch controls
  const handleBomb = () => {
    if (isPaused) return;
    inputRef.current.bomb = true;
  };

  // Game loop update - Removed to prevent re-renders
  // Logic moved to Systems (PlayerSystem, PowerUpSystem)




  // Helper function: Handle spawning of enemies and power-ups
  const handleSpawning = (
    entities: Record<string, GameEntity>,
    currentTime: number,
    dispatch: (event: any) => void
  ): Record<string, GameEntity> => {
    const updatedEntities = { ...entities };
    const spawnInterval = 2000; // 2 seconds between spawns

    // Check if it's time to spawn new enemies
    if (currentTime - gameState.lastSpawnTime > spawnInterval) {
      // Spawn a random enemy
      const enemyTypes = ['basic', 'diving', 'shooting'];
      const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      const enemyX = Math.random() * (SCREEN_WIDTH - 50) + 25;

      const enemy = createEnemyEntity(
        { x: enemyX, y: -50 },
        randomType as any
      );
      updatedEntities[enemy.id] = enemy;

      // Update last spawn time
      updateGameState({ lastSpawnTime: currentTime });

      // Dispatch spawn event
      dispatch({
        type: 'enemySpawn',
        data: { enemyType: randomType, position: { x: enemyX, y: -50 } },
      });
    }

    // Random power-up drops from destroyed enemies (handled in collision system)
    return updatedEntities;
  };

  // Helper function: Clean up off-screen entities
  const handleCleanup = (entities: Record<string, GameEntity>): Record<string, GameEntity> => {
    const updatedEntities = { ...entities };

    Object.keys(updatedEntities).forEach(id => {
      const entity = updatedEntities[id];
      const position = entity.components.position;

      if (!position) return;

      // Remove entities that are off-screen
      const isOffScreen =
        position.y > SCREEN_HEIGHT + 100 || // Below screen
        position.y < -100 || // Above screen
        position.x < -100 || // Left of screen
        position.x > SCREEN_WIDTH + 100; // Right of screen

      if (isOffScreen && entity.type !== EntityType.PLAYER) {
        delete updatedEntities[id];
      }
    });

    return updatedEntities;
  };

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

  // Helper function: Update power-up durations
  const updatePowerUpDurations = (deltaTime: number) => {
    // This would track active power-ups and reduce their durations
    // For now, it's a placeholder that will be implemented when power-up system is complete
  };

  // Helper function: Handle player shooting
  const handlePlayerShoot = () => {
    inputRef.current.shooting = true;

    // Reset shooting flag after a short delay to prevent stuck trigger
    // In a real system, we'd handle "isPressed" state better, but for single tap events:
    setTimeout(() => {
      inputRef.current.shooting = false;
    }, 50);
  };


  return (
    <View style={styles.container}>
      <RNGameEngine
        ref={gameEngineRef}
        style={styles.gameEngine}
        systems={systems}
        entities={entities}
        running={!isPaused}
        onEvent={handleEvent}
        renderer={RenderingSystem}
      />

      {/* Game UI overlay */}
      <View style={styles.uiOverlay}>
        {/* Score display */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{gameState.score}</Text>
        </View>

        {/* Lives display */}
        <View style={styles.livesContainer}>
          {Array.from({ length: gameState.lives }).map((_, index) => (
            <View key={index} style={styles.lifeIcon} />
          ))}
        </View>

        {/* Wave display */}
        <View style={styles.waveContainer}>
          <Text style={styles.waveLabel}>WAVE</Text>
          <Text style={styles.waveValue}>{gameState.currentWave}</Text>
        </View>

      </View>

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
    pointerEvents: 'none',
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
});