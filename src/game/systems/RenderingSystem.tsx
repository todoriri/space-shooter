// Rendering System for Entity-Component-System architecture
// Maps game entities to React Native visual components with optimized rendering

import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { GameEntity, EntityType, PowerUpType, EnemyType, BulletType } from '../../types';
import { assetManager } from '../../utils/AssetManager';
import { EntitySprite } from '../components/rendering/EntitySprite';
import { HealthBar } from '../components/rendering/HealthBar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Development mode check
const isDevelopmentMode = __DEV__;

// Helper to check if an asset is a placeholder
const isPlaceholderAsset = (spriteKey?: string): boolean => {
  if (!spriteKey) return false;
  return assetManager.isPlaceholderAsset(spriteKey);
};

export interface HealthBarProps {
  current: number;
  max: number;
  width?: number | string;
  height?: number;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
}

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

  // 1. Calculate Global Shake Offset
  // Find the system entity (optimized: simpler loop, or we assume it's there)
  // Since this runs every frame, we want to be fast. 
  // Maybe checking for 'system_shake' id directly is better if we enforce that ID?
  // Let's iterate once or check specific key if we know it.
  // We'll stick to a quick find for now or check entities['system_shake'] based on ShakeSystem.ts.
  const shakeComp = entities['system_shake']?.components?.screenShake;
  const shakeX = shakeComp ? shakeComp.currentOffset.x : 0;
  const shakeY = shakeComp ? shakeComp.currentOffset.y : 0;

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
    // APPLY SHAKE HERE
    let screenX = position.x - (position.width || 0) / 2;
    let screenY = position.y - (position.height || 0) / 2;

    // Don't shake UI/HUD if we had checking. 
    // Entities here are game world objects. UI is separate in GameEngine potentially,
    // OR entities usually include floating text which we DO want to shake? usually yes.
    screenX += shakeX;
    screenY += shakeY;

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
      case EntityType.FLOATING_TEXT:
        renderComponent = renderFloatingText(entity, entityStyle);
        break;
      case 'particle': // Explicit check for particle string type if EntityType enum isn't updated yet
        renderComponent = renderParticle(entity, entityStyle);
        break;
      default:
        // Use container style for generic
        renderComponent = <View key={entity.id} style={[entityStyle, styles.container]} />;
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

  // Override background color to avoid "blue box" behind sprite
  const containerStyle = { ...style, backgroundColor: 'transparent' };

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

  return (
    <View key={entity.id} style={[style, styles.container, { backgroundColor: 'transparent' }]}>
      <EntitySprite
        type={EntityType.PLAYER}
        width={style.width}
        height={style.height}
        color={renderable?.color || '#FFFFFF'}
        isPlaceholder={isDevelopmentMode && isPlaceholder}
      />
      {/* Shield effect if active */}
      {entity.components.health?.invulnerable && (
        <View style={styles.shieldEffect} />
      )}
    </View>
  );
};

// Render enemy based on type
const renderEnemy = (entity: GameEntity, style: any): JSX.Element => {
  const enemyComp = entity.components.enemy;
  const enemyType = enemyComp?.type || EnemyType.BASIC;
  const renderable = entity.components.renderable;

  // Actually style contains position and rotation, so we keep it but override bg color
  const containerStyle = { ...style, backgroundColor: 'transparent' };

  // Hit Flash Logic
  if (enemyComp?.hitFlashTimer && enemyComp.hitFlashTimer > 0) {
    // Decrease timer (hacky: modifying state in render is bad practice but common for simple visual-only effects in RNGE)
    // Ideally this should be in a system, but doing it here ensures it's tied to frames.
    // Better: The ShakeSystem or MovementSystem should decrement this.
    // For now, let's just use it to determine color.
    // FLASH WHITE
    enemyComp.hitFlashTimer -= 1; // Decrement for next frame
    // We will override the color prop passed to EntitySprite
    if (renderable) renderable.color = '#FFFFFF'; // Force white
  }

  const { width, height } = style;

  // Helper to determine subType for EntitySprite
  const getSubType = (e: GameEntity) => {
    switch (e.type) {
      case EntityType.ENEMY: return e.components.enemy?.type;
      case EntityType.BULLET: return e.components.bullet?.type;
      case EntityType.POWER_UP: return e.components.powerUp?.type;
      default: return undefined;
    }
  };

  return (
    <View key={entity.id} style={[style, styles.container, { backgroundColor: 'transparent' }]}>
      <EntitySprite
        type={entity.type}
        subType={getSubType(entity)}
        width={width}
        height={height}
        color={renderable?.color || '#FFFFFF'}
        isPlaceholder={renderable?.sprite === undefined}
      />
      {/* Health bar for boss */}
      {enemyType === EnemyType.BOSS && entity.components.health && (
        <View style={styles.bossHealthBarContainer}>
          <HealthBar
            current={entity.components.health.current}
            max={entity.components.health.max}
            width="120%"
            height={6}
            color="#4CAF50"
            borderRadius={3}
          />
        </View>
      )}
    </View>
  );
};

// Render bullet based on type
const renderBullet = (entity: GameEntity, style: any): JSX.Element => {
  const bulletComp = entity.components.bullet;
  const bulletType = bulletComp?.type || BulletType.PLAYER;
  const renderable = entity.components.renderable;

  // Helper to determine subType
  const getSubType = (e: GameEntity) => e.components.bullet?.type;

  const { width, height } = style;

  return (
    <View key={entity.id} style={[style, styles.container, { backgroundColor: 'transparent' }]}>
      {/* Trail effect logic simplified or moved */}
      {entity.components.renderable?.trailEffect ? (
        <View style={{
          position: 'absolute',
          top: -10,
          width: width * 0.5,
          height: 10,
          backgroundColor: renderable?.color,
          opacity: 0.5
        }} />
      ) : null}
      <EntitySprite
        type={EntityType.BULLET}
        subType={getSubType(entity)}
        width={width}
        height={height}
        color={renderable?.color || '#FFFFFF'}
        isPlaceholder={renderable?.sprite === undefined}
      />
    </View>
  );
};

// Render power-up based on type
const renderPowerUp = (entity: GameEntity, style: any): JSX.Element => {
  const powerUpComp = entity.components.powerUp;
  const powerUpType = powerUpComp?.type || PowerUpType.SHIELD;
  const renderable = entity.components.renderable;

  // Helper to determine subType
  const getSubType = (e: GameEntity) => e.components.powerUp?.type;

  const { width, height } = style;

  return (
    <View key={entity.id} style={[style, styles.container, { backgroundColor: 'transparent' }]}>
      <EntitySprite
        type={EntityType.POWER_UP}
        subType={getSubType(entity)}
        width={width}
        height={height}
        color={renderable?.color || '#FFFFFF'}
        isPlaceholder={renderable?.sprite === undefined}
      />
    </View>
  );
};

// Render generic entity (fallback)
const renderGeneric = (entity: GameEntity, style: any): JSX.Element => {
  return <View key={entity.id} style={[style, { justifyContent: 'center', alignItems: 'center' }]} />;
};

// Render floating text
const renderFloatingText = (entity: GameEntity, style: any): JSX.Element => {
  const ft = entity.components.floatingText;
  const renderable = entity.components.renderable;

  if (!ft) return <View />;

  return (
    <View key={entity.id} style={[style, styles.container, { backgroundColor: 'transparent' }]}>
      <Text style={{
        color: renderable?.color || '#FFFFFF',
        fontSize: ft.size,
        fontWeight: 'bold',
        textShadowColor: 'black',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        opacity: renderable?.alpha || 1,
      }}>
        {ft.text}
      </Text>
    </View>
  );
};

// Render particle (simple shape/sprite)
const renderParticle = (entity: GameEntity, style: any): JSX.Element => {
  const renderable = entity.components.renderable;

  // Particles are typically just shapes/colors, so we ensure no background on container
  // and let the style (which has bg color) apply, BUT we need to handle "glow" or specific shapes.
  // Actually, style already HAS backgroundColor from main loop.
  // The issue was "Exploding Square".
  // The main loop (line 84) sets backgroundColor: renderable.color.
  // If we want a nice particle, we might want a rounded generic shape or image.

  // For now, let's make particles rounded by default if they are small, or custom.
  // Override borderRadius in style
  const particleStyle = {
    ...style,
    borderRadius: style.width / 2, // Circle by default
  };

  return (
    <View key={entity.id} style={[particleStyle, styles.container]} />
  );
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
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Shield effect
  shieldEffect: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#29B6F6',
    opacity: 0.5,
  },

  // Boss Health Bar
  bossHealthBarContainer: {
    position: 'absolute',
    bottom: -15,
    width: '120%',
    alignItems: 'center',
  },

  // Keep legacy styles referenced by other parts if any, or safe delete
  // ...
});

// Export a simple component for testing
export const EntityRenderer: React.FC<{ entities: Record<string, GameEntity> }> = ({ entities }) => {
  const renderables = RenderingSystem(entities);
  return <>{renderables}</>;
};