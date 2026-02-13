import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { GameEngine as RNGameEngine } from 'react-native-game-engine';
import { GameState, GameEvent, GameEntity, EntityType } from '../types';
import { MovementSystem } from './systems/MovementSystemV2';
import { CollisionSystem } from './systems/CollisionSystemV2';
import { PowerUpSystem } from './systems/PowerUpSystem';
import { AudioSystem, initializeAudioSystem } from './systems/AudioSystem';
import { WaveSystem } from './systems/WaveSystem';
import { ParticleSystem, handleParticleEvent } from './systems/ParticleSystem';
import { EntityRenderer } from './systems/RenderingSystem';
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

export const SpaceShooterGame: React.FC<SpaceShooterGameProps> = ({
  onScoreUpdate,
  onGameOver,
  onPause,
  isPaused = false,
  gameState,
  updateGameState,
  highScore,
}) => {
  const gameEngineRef = useRef<RNGameEngine>(null);
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
  const handlePlayerMove = (direction: { x: number; y: number }) => {
    if (!gameEngineRef.current || isPaused) return;

    // Convert direction to touch position for movement system
    const playerSpeed = 300;
    const touchDistance = 100; // Distance from player for touch target

    setEntities(currentEntities => {
      const updatedEntities = { ...currentEntities };
      Object.keys(updatedEntities).forEach(id => {
        const entity = updatedEntities[id];
        if (entity.type === EntityType.PLAYER && entity.components.player && entity.components.position) {
          const playerPos = entity.components.position;

          // Calculate target position based on direction
          const targetX = playerPos.x + direction.x * touchDistance;
          const targetY = playerPos.y + direction.y * touchDistance;

          // Update touch position for movement system
          updatedEntities[id] = {
            ...entity,
            components: {
              ...entity.components,
              player: {
                ...entity.components.player,
                touchPosition: direction.x === 0 && direction.y === 0 ? undefined : { x: targetX, y: targetY },
              },
            },
          };
        }
      });
      return updatedEntities;
    });
  };

  // Handle player shoot from touch controls
  const handlePlayerShoot = () => {
    handleEvent({
      type: 'playerShoot',
      data: { timestamp: Date.now() },
    });
  };

  // Handle bomb action from touch controls
  const handleBomb = () => {
    // Check if player has bomb power-up
    setEntities(currentEntities => {
      const updatedEntities = { ...currentEntities };
      Object.keys(updatedEntities).forEach(id => {
        const entity = updatedEntities[id];
        if (entity.type === EntityType.PLAYER && entity.components.player) {
          const hasBomb = entity.components.player.powerUps.includes('bomb');
          if (hasBomb) {
            // Trigger bomb explosion
            handleEvent({
              type: 'bombExplosion',
              data: { timestamp: Date.now() },
            });

            // Remove bomb from power-ups
            updatedEntities[id] = {
              ...entity,
              components: {
                ...entity.components,
                player: {
                  ...entity.components.player,
                  powerUps: entity.components.player.powerUps.filter(p => p !== 'bomb'),
                },
              },
            };
          }
        }
      });
      return updatedEntities;
    });
  };

  // Game loop update
  const onUpdate = (deltaTime: number) => {
    if (isPaused) return;

    // Update game time
    const newGameTime = gameState.gameTime + deltaTime;
    updateGameState({ gameTime: newGameTime });

    // Update player shooting cooldown
    setEntities(currentEntities => {
      const updatedEntities = { ...currentEntities };
      Object.keys(updatedEntities).forEach(id => {
        const entity = updatedEntities[id];
        if (entity.type === EntityType.PLAYER && entity.components.player) {
          const playerComp = entity.components.player;
          if (playerComp.lastShotTime > 0) {
            updatedEntities[id] = {
              ...entity,
              components: {
                ...entity.components,
                player: {
                  ...playerComp,
                  lastShotTime: Math.max(0, playerComp.lastShotTime - deltaTime / 1000),
                },
              },
            };
          }
        }
      });
      return updatedEntities;
    });

    // Update power-up durations
    updatePowerUpDurations(deltaTime);
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
        onUpdate={onUpdate}
      >
        <EntityRenderer entities={entities} />
      </RNGameEngine>

      {/* Game UI overlay */}
      <View style={styles.uiOverlay}>
        {/* Score display */}
        <View style={styles.scoreContainer}>
          <View style={styles.scoreLabel}>SCORE</View>
          <View style={styles.scoreValue}>{gameState.score}</View>
        </View>

        {/* Lives display */}
        <View style={styles.livesContainer}>
          {Array.from({ length: gameState.lives }).map((_, index) => (
            <View key={index} style={styles.lifeIcon} />
          ))}
        </View>

        {/* Wave display */}
        <View style={styles.waveContainer}>
          <View style={styles.waveLabel}>WAVE</View>
          <View style={styles.waveValue}>{gameState.currentWave}</View>
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
};

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
    setEntities(currentEntities => {
      const updatedEntities = { ...currentEntities };
      const playerId = Object.keys(updatedEntities).find(
        id => updatedEntities[id].type === EntityType.PLAYER
      );

      if (!playerId) return updatedEntities;

      const player = updatedEntities[playerId];
      const playerComp = player.components.player;
      const position = player.components.position;

      if (!playerComp || !position || playerComp.lastShotTime > 0) {
        return updatedEntities;
      }

      // Create bullet
      const bullet = createBulletEntity(
        { ...position },
        { x: 0, y: -600, maxSpeed: 800, acceleration: 0, friction: 0 },
        'player',
        playerId
      );

      updatedEntities[bullet.id] = bullet;

      // Update player's last shot time
      updatedEntities[playerId] = {
        ...player,
        components: {
          ...player.components,
          player: {
            ...playerComp,
            lastShotTime: playerComp.shootCooldown,
          },
        },
      };

      // Dispatch shoot event
      if (gameEngineRef.current) {
        gameEngineRef.current.dispatch({
          type: 'playerShoot',
          data: { position: { x: position.x, y: position.y } },
        });
      }

      return updatedEntities;
    });
  };

  // Update event handler to call handlePlayerShoot
  useEffect(() => {
    const handleEventWrapper = (event: GameEvent) => {
      if (event.type === 'playerShoot') {
        handlePlayerShoot();
      }
      handleEvent(event);
    };

    // Replace the event handler
    // This is a simplified approach - in a real implementation,
    // we would refactor the event handling system
  }, []);

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