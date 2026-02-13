// Rendering System for Entity-Component-System architecture
// Maps game entities to React Native visual components with optimized rendering

import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { GameEntity, EntityType, PowerUpType, EnemyType, BulletType } from '../../types';
import { assetManager } from '../../utils/AssetManager';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Development mode check
const isDevelopmentMode = __DEV__;

// Helper to check if an asset is a placeholder
const isPlaceholderAsset = (spriteKey?: string): boolean => {
  if (!spriteKey) return false;
  return assetManager.isPlaceholderAsset(spriteKey);
};

// Component types for rendering
export interface RenderableComponent {
  visible: boolean;
  zIndex: number;
  sprite?: string;
  color: string;
  alpha: number;
  rotation?: number;
  scale?: number;
  glowEffect?: boolean;
  pulseEffect?: boolean;
  pulseSpeed?: number;
  trailEffect?: boolean;
  trailLength?: number;
}

// Props for game entity components
export interface EntityRenderProps {
  entity: GameEntity;
  style: any;
}

// System function that renders all entities
export const RenderingSystem = (entities: Record<string, GameEntity>) => {
  const renderables: JSX.Element[] = [];

  if (!entities) return renderables;

  Object.keys(entities).forEach(id => {
    const entity = entities[id];

    // Skip if entity is not active or not visible
    if (!entity.active || !entity.components.renderable?.visible) {
      return;
    }

    const renderable = entity.components.renderable;
    const position = entity.components.position;

    if (!position) return;

    // Calculate screen position (center of entity)
    const screenX = position.x - (position.width || 0) / 2;
    const screenY = position.y - (position.height || 0) / 2;

    // Create style for the entity
    const entityStyle = {
      position: 'absolute' as const,
      left: screenX,
      top: screenY,
      width: position.width || 0,
      height: position.height || 0,
      backgroundColor: renderable.color,
      opacity: renderable.alpha,
      borderRadius: entity.components.collider?.type === 'circle' ? 999 : 0,
      transform: [
        { rotate: `${position.rotation || 0}deg` },
        { scale: renderable.scale || 1 },
      ],
      zIndex: renderable.zIndex || 0,
    };

    // Add glow effect if enabled
    if (renderable.glowEffect) {
      const style = entityStyle as any;
      style.shadowColor = renderable.color;
      style.shadowOffset = { width: 0, height: 0 };
      style.shadowOpacity = 0.8;
      style.shadowRadius = 10;
      style.elevation = 10; // For Android
    }

    // Add pulse animation if enabled
    if (renderable.pulseEffect) {
      const pulseSpeed = renderable.pulseSpeed || 2;
      const pulseScale = 1 + Math.sin(Date.now() * 0.001 * pulseSpeed) * 0.1;
      entityStyle.transform.push({ scale: pulseScale });
    }

    // Create the renderable component based on entity type
    let renderComponent: JSX.Element;

    switch (entity.type) {
      case EntityType.PLAYER:
        renderComponent = renderPlayer(entity, entityStyle);
        break;
      case EntityType.ENEMY:
        renderComponent = renderEnemy(entity, entityStyle);
        break;
      case EntityType.BULLET:
        renderComponent = renderBullet(entity, entityStyle);
        break;
      case EntityType.POWER_UP:
        renderComponent = renderPowerUp(entity, entityStyle);
        break;
      default:
        renderComponent = renderGeneric(entity, entityStyle);
    }

    renderables.push(renderComponent);
  });

  return renderables;
};

// Render player ship
const renderPlayer = (entity: GameEntity, style: any): JSX.Element => {
  const playerComp = entity.components.player;
  const healthComp = entity.components.health;
  const renderable = entity.components.renderable;

  // Check if using placeholder asset
  const isPlaceholder = isPlaceholderAsset(renderable?.sprite);

  // Add invulnerability effect (blinking)
  if (healthComp?.invulnerable) {
    const blinkRate = 10; // Blinks per second
    const shouldShow = Math.floor(Date.now() * 0.001 * blinkRate * 2) % 2 === 0;
    if (!shouldShow) {
      style.opacity = 0.3;
    }
  }

  // Add placeholder border in development mode
  if (isDevelopmentMode && isPlaceholder) {
    style.borderWidth = 2;
    style.borderColor = '#FF9800';
    style.borderStyle = 'dashed';
  }

  // Player ship shape (triangle pointing up)
  return (
    <View key={entity.id} style={[style, styles.playerShip]}>
      {/* Player ship body */}
      <View style={styles.playerBody} />

      {/* Engine glow */}
      <View style={styles.engineGlow} />

      {/* Shield effect if active */}
      {entity.components.health?.invulnerable && (
        <View style={styles.shieldEffect} />
      )}

      {/* Placeholder indicator in development mode */}
      {isDevelopmentMode && isPlaceholder && (
        <View style={styles.placeholderIndicator}>
          <Text style={styles.placeholderText}>P</Text>
        </View>
      )}
    </View>
  );
};

// Render enemy based on type
const renderEnemy = (entity: GameEntity, style: any): JSX.Element => {
  const enemyComp = entity.components.enemy;
  const enemyType = enemyComp?.type || EnemyType.BASIC;

  // Adjust style based on enemy type
  switch (enemyType) {
    case EnemyType.BASIC:
      style.backgroundColor = '#FF6B6B'; // Red
      break;
    case EnemyType.DIVING:
      style.backgroundColor = '#FFA726'; // Orange
      style.borderRadius = 8;
      break;
    case EnemyType.SHOOTING:
      style.backgroundColor = '#66BB6A'; // Green
      style.borderRadius = 6;
      break;
    case EnemyType.BOSS:
      style.backgroundColor = '#AB47BC'; // Purple
      style.borderRadius = 20;
      style.shadowRadius = 20;
      style.elevation = 20;
      break;
  }

  // Health bar for boss
  if (enemyType === EnemyType.BOSS && entity.components.health) {
    const health = entity.components.health;
    const healthPercent = (health.current / health.max) * 100;

    return (
      <View key={entity.id} style={[style, styles.bossContainer]}>
        <View style={styles.bossBody} />

        {/* Boss health bar */}
        <View style={styles.bossHealthBar}>
          <View style={[styles.bossHealthFill, { width: `${healthPercent}%` }]} />
        </View>
      </View>
    );
  }

  return (
    <View key={entity.id} style={[style, styles.enemyShip]}>
      <View style={styles.enemyBody} />
    </View>
  );
};

// Render bullet based on type
const renderBullet = (entity: GameEntity, style: any): JSX.Element => {
  const bulletComp = entity.components.bullet;
  const bulletType = bulletComp?.type || BulletType.PLAYER;

  // Adjust style based on bullet type
  switch (bulletType) {
    case BulletType.PLAYER:
      style.backgroundColor = '#4FC3F7'; // Light blue
      style.borderRadius = 999;
      break;
    case BulletType.ENEMY:
      style.backgroundColor = '#FF8A65'; // Light red
      style.borderRadius = 999;
      style.transform = [{ rotate: '180deg' }]; // Pointing downward
      break;
    case BulletType.POWER_UP:
      style.backgroundColor = '#BA68C8'; // Purple
      style.borderRadius = 999;
      style.shadowColor = '#BA68C8';
      style.shadowRadius = 15;
      style.elevation = 15;
      break;
  }

  // Trail effect for bullets
  if (entity.components.renderable?.trailEffect) {
    const trailLength = entity.components.renderable.trailLength || 10;
    const velocity = entity.components.velocity;

    if (velocity) {
      // Calculate trail direction
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      if (speed > 0) {
        const trailStyle = {
          ...style,
          width: (style.width as number) * 0.5,
          height: trailLength,
          backgroundColor: `${style.backgroundColor}80`, // 50% opacity
          left: (style.left as number) + (style.width as number) / 4,
          top: (style.top as number) - trailLength,
        };

        return (
          <View key={entity.id}>
            <View style={trailStyle} />
            <View style={[style, styles.bullet]} />
          </View>
        );
      }
    }
  }

  return <View key={entity.id} style={[style, styles.bullet]} />;
};

// Render power-up based on type
const renderPowerUp = (entity: GameEntity, style: any): JSX.Element => {
  const powerUpComp = entity.components.powerUp;
  const powerUpType = powerUpComp?.type || PowerUpType.SHIELD;

  // Adjust style based on power-up type
  switch (powerUpType) {
    case PowerUpType.SHIELD:
      style.backgroundColor = '#29B6F6'; // Blue
      break;
    case PowerUpType.RAPID_FIRE:
      style.backgroundColor = '#FFEE58'; // Yellow
      break;
    case PowerUpType.MULTI_SHOT:
      style.backgroundColor = '#66BB6A'; // Green
      break;
    case PowerUpType.BOMB:
      style.backgroundColor = '#EF5350'; // Red
      break;
    case PowerUpType.HEALTH:
      style.backgroundColor = '#EC407A'; // Pink
      break;
    case PowerUpType.SCORE:
      style.backgroundColor = '#AB47BC'; // Purple
      break;
  }

  // Power-up icon (simple geometric shape)
  let iconStyle: any = styles.powerUpIcon;
  switch (powerUpType) {
    case PowerUpType.SHIELD:
      iconStyle = styles.shieldIcon;
      break;
    case PowerUpType.RAPID_FIRE:
      iconStyle = styles.rapidFireIcon;
      break;
    case PowerUpType.MULTI_SHOT:
      iconStyle = styles.multiShotIcon;
      break;
    case PowerUpType.BOMB:
      iconStyle = styles.bombIcon;
      break;
    case PowerUpType.HEALTH:
      iconStyle = styles.healthIcon;
      break;
    case PowerUpType.SCORE:
      iconStyle = styles.scoreIcon;
      break;
  }

  return (
    <View key={entity.id} style={[style, styles.powerUp]}>
      <View style={iconStyle} />
    </View>
  );
};

// Render generic entity (fallback)
const renderGeneric = (entity: GameEntity, style: any): JSX.Element => {
  return <View key={entity.id} style={[style, styles.generic]} />;
};

// Helper to create renderable component
export const createRenderableComponent = (
  color: string = '#FFFFFF',
  options: Partial<RenderableComponent> = {}
): RenderableComponent => ({
  visible: true,
  zIndex: options.zIndex || 0,
  color,
  alpha: options.alpha || 1,
  rotation: options.rotation || 0,
  scale: options.scale || 1,
  glowEffect: options.glowEffect || false,
  pulseEffect: options.pulseEffect || false,
  pulseSpeed: options.pulseSpeed || 2,
  trailEffect: options.trailEffect || false,
  trailLength: options.trailLength || 10,
});

// Styles for different entity types
const styles = StyleSheet.create({
  // Player ship styles
  playerShip: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerBody: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderBottomWidth: 40,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
    transform: [{ translateY: -10 }], // Center visually
  },
  engineGlow: {
    position: 'absolute',
    bottom: -5,
    width: '40%',
    height: 10,
    backgroundColor: '#4FC3F7',
    borderRadius: 5,
    opacity: 0.7,
  },
  shieldEffect: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#29B6F6',
    opacity: 0.5,
  },

  // Enemy ship styles
  enemyShip: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  enemyBody: {
    width: '70%',
    height: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  bossContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bossBody: {
    width: '80%',
    height: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  bossHealthBar: {
    position: 'absolute',
    bottom: -15,
    width: '120%',
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bossHealthFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },

  // Bullet styles
  bullet: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Power-up styles
  powerUp: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
  },
  powerUpIcon: {
    width: '50%',
    height: '50%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  shieldIcon: {
    width: '60%',
    height: '60%',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#29B6F6',
  },
  rapidFireIcon: {
    width: '50%',
    height: '50%',
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  multiShotIcon: {
    width: '50%',
    height: '50%',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    position: 'relative',
  },
  bombIcon: {
    width: '50%',
    height: '50%',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
  },
  healthIcon: {
    width: '50%',
    height: '50%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  scoreIcon: {
    width: '50%',
    height: '50%',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
  },

  // Generic entity style
  generic: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Placeholder indicator styles (development only)
  placeholderIndicator: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  placeholderText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

// Export a simple component for testing
export const EntityRenderer: React.FC<{ entities: Record<string, GameEntity> }> = ({ entities }) => {
  const renderables = RenderingSystem(entities);
  return <>{renderables}</>;
};