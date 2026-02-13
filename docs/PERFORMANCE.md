# Space Shooter Mobile Game - Performance Optimization Guide

## Overview
This document outlines performance optimization strategies for the Space Shooter mobile game. Mobile games have unique performance constraints including limited CPU/GPU resources, battery life considerations, and thermal throttling. This guide provides techniques to achieve and maintain 60fps gameplay across all target platforms.

## Performance Targets

### Core Metrics
- **Frame Rate**: 60fps target (minimum 45fps during intense action)
- **Input Latency**: < 100ms touch-to-response time
- **Memory Usage**: < 200MB peak memory consumption
- **Load Time**: < 3 seconds to initial gameplay
- **Battery Impact**: < 10% per hour of gameplay (typical device)

### Platform-Specific Targets
| Platform | Target FPS | Memory Limit | Battery Target |
|----------|------------|--------------|----------------|
| **Android (Flagship)** | 60fps | 250MB | 8%/hour |
| **Android (Mid-range)** | 50fps | 150MB | 12%/hour |
| **iOS** | 60fps | 200MB | 7%/hour |
| **Web** | 60fps | 300MB | N/A |

## Performance Monitoring

### Built-in Performance Monitor
The game includes a `PerformanceMonitor` utility (`src/utils/PerformanceMonitor.ts`) that provides:

```typescript
// Basic usage
import { performanceMonitor } from '../src/utils/PerformanceMonitor';

// Start monitoring
performanceMonitor.startMonitoring();

// Log performance metrics
console.log('Current FPS:', performanceMonitor.getCurrentFPS());
console.log('Memory usage:', performanceMonitor.getMemoryUsage());

// Monitor specific operations
performanceMonitor.startOperation('collision_detection');
// ... collision detection code ...
performanceMonitor.endOperation('collision_detection');
```

### Key Performance Indicators (KPIs)
1. **FPS (Frames Per Second)**: Primary gameplay smoothness metric
2. **Frame Time**: Time to render each frame (target: <16.67ms)
3. **Memory Usage**: Heap and native memory consumption
4. **GC Pauses**: Garbage collection impact on frame times
5. **Input Latency**: Touch event processing time
6. **Asset Load Times**: Texture and sound loading duration

## Rendering Optimization

### Entity-Component-System Efficiency
The ECS architecture provides natural performance benefits:

```typescript
// Optimized system execution
export const MovementSystem = (entities: Record<string, GameEntity>, { time }: { time: number }) => {
  const deltaTime = Math.min(time.delta, 100) / 1000; // Cap delta time

  Object.values(entities).forEach(entity => {
    if (entity.position && entity.velocity) {
      // Batch position updates
      entity.position.x += entity.velocity.x * deltaTime;
      entity.position.y += entity.velocity.y * deltaTime;
    }
  });

  return entities;
};
```

### Rendering Best Practices

#### 1. **Minimize Re-renders**
```typescript
// Use React.memo for game components
const PlayerShip = React.memo(({ position, rotation }: PlayerShipProps) => {
  return (
    <View style={[
      styles.playerShip,
      {
        transform: [
          { translateX: position.x },
          { translateY: position.y },
          { rotate: `${rotation}deg` },
        ],
      },
    ]} />
  );
});

// Custom comparison function for complex props
const arePropsEqual = (prevProps: PlayerShipProps, nextProps: PlayerShipProps) => {
  return (
    prevProps.position.x === nextProps.position.x &&
    prevProps.position.y === nextProps.position.y &&
    prevProps.rotation === nextProps.rotation
  );
};

export default React.memo(PlayerShip, arePropsEqual);
```

#### 2. **Batch Style Updates**
```typescript
// Bad: Multiple style objects
<View style={{ left: x, top: y, width: size, height: size }} />

// Good: Single style object with transform
<View style={{
  position: 'absolute',
  transform: [
    { translateX: x },
    { translateY: y },
  ],
  width: size,
  height: size,
}} />
```

#### 3. **Use Native Driver for Animations**
```typescript
// Use native driver for smooth animations
Animated.timing(animationValue, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // Critical for performance
}).start();
```

### Texture and Asset Optimization

#### 1. **Sprite Sheets**
Combine related sprites into texture atlases:
```
spritesheet.png
├── player_ship (40x40)
├── enemy_basic (30x30)
├── enemy_diving (35x35)
├── bullet_player (10x20)
└── bullet_enemy (10x20)
```

#### 2. **Texture Compression**
- **Android**: ETC2 or ASTC compression
- **iOS**: PVRTC compression
- **Web**: WebP format with fallback

#### 3. **Mipmapping**
Generate mipmaps for textures that scale:
```typescript
// Enable mipmapping for distant objects
const textureOptions = {
  minFilter: 'linear',
  magFilter: 'linear',
  mipmap: true,
};
```

## Memory Management

### Asset Loading Strategy

#### 1. **Progressive Loading**
```typescript
// AssetManager implementation
class AssetManager {
  async loadEssentialAssets() {
    // Load minimal assets for initial gameplay
    await this.loadAsset('player_ship');
    await this.loadAsset('background');
    await this.loadAsset('ui_font');
  }

  async preloadAssets(category: 'game' | 'ui' | 'audio') {
    // Background loading of remaining assets
    const assets = this.getAssetsByCategory(category);
    assets.forEach(asset => {
      this.loadInBackground(asset);
    });
  }
}
```

#### 2. **LRU Cache Implementation**
```typescript
class AssetCache {
  private cache = new Map<string, any>();
  private maxSize: number;

  get(key: string): any {
    const value = this.cache.get(key);
    if (value) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, value: any): void {
    if (this.cache.size >= this.maxSize) {
      // Remove least recently used item
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

#### 3. **Memory-Aware Cleanup**
```typescript
// Clean up unused assets during gameplay pauses
const cleanupOldAssets = (keepList: string[]) => {
  const allAssets = Object.keys(assetCache);
  const toRemove = allAssets.filter(asset => !keepList.includes(asset));

  toRemove.forEach(asset => {
    if (assetCache[asset].lastUsed < Date.now() - 30000) { // 30 seconds
      unloadAsset(asset);
    }
  });
};
```

### Entity Pooling

#### 1. **Object Pool Implementation**
```typescript
class EntityPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (entity: T) => void;

  constructor(createFn: () => T, resetFn: (entity: T) => void) {
    this.createFn = createFn;
    this.resetFn = resetFn;
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  release(entity: T): void {
    this.resetFn(entity);
    this.pool.push(entity);
  }
}

// Usage for bullets
const bulletPool = new EntityPool<BulletEntity>(
  () => createBulletEntity(),
  (bullet) => {
    bullet.position = { x: 0, y: 0 };
    bullet.velocity = { x: 0, y: 0 };
    bullet.active = false;
  }
);
```

#### 2. **Pool Sizing Strategy**
```typescript
// Dynamic pool sizing based on gameplay needs
class DynamicEntityPool<T> extends EntityPool<T> {
  private maxSize: number;
  private peakUsage: number = 0;

  adjustSizeBasedOnUsage(): void {
    const currentUsage = this.getActiveCount();
    this.peakUsage = Math.max(this.peakUsage, currentUsage);

    // Increase pool size if we're consistently at capacity
    if (currentUsage > this.maxSize * 0.8) {
      this.maxSize = Math.ceil(this.peakUsage * 1.5);
    }
  }
}
```

## Game Loop Optimization

### Fixed Time Step with Variable Rendering
```typescript
class GameLoop {
  private fixedTimeStep = 1000 / 60; // 60Hz physics
  private maxAccumulator = 1000; // Cap at 1 second
  private accumulator = 0;
  private lastTime = 0;

  update(currentTime: number): void {
    const deltaTime = Math.min(currentTime - this.lastTime, 100);
    this.lastTime = currentTime;

    // Accumulate time for fixed updates
    this.accumulator += deltaTime;

    // Cap accumulator to prevent spiral of death
    if (this.accumulator > this.maxAccumulator) {
      this.accumulator = this.maxAccumulator;
    }

    // Execute fixed updates
    while (this.accumulator >= this.fixedTimeStep) {
      this.fixedUpdate(this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
    }

    // Variable rendering with interpolation
    const alpha = this.accumulator / this.fixedTimeStep;
    this.render(alpha);
  }

  private fixedUpdate(deltaTime: number): void {
    // Physics, collision detection, AI
    MovementSystem.update(deltaTime);
    CollisionSystem.update(deltaTime);
    AISystem.update(deltaTime);
  }

  private render(alpha: number): void {
    // Interpolated rendering for smooth visuals
    RenderingSystem.render(alpha);
  }
}
```

### Priority-Based System Execution
```typescript
// Execute systems in priority order
const systemExecutionOrder = [
  { system: InputSystem, priority: 0 },      // Highest priority
  { system: MovementSystem, priority: 1 },
  { system: CollisionSystem, priority: 2 },
  { system: SpawningSystem, priority: 3 },
  { system: RenderingSystem, priority: 4 },  // Lowest priority
];

// Adaptive system skipping under load
const executeSystems = (entities: GameEntity[], time: BudgetedTime) => {
  systemExecutionOrder.forEach(({ system, priority }) => {
    if (time.remaining > system.estimatedCost) {
      system.execute(entities, time);
      time.remaining -= system.actualCost;
    } else if (priority < 2) { // Critical systems
      // Execute critical systems even if over budget
      system.execute(entities, time);
    }
    // Non-critical systems are skipped if out of time
  });
};
```

## Collision Detection Optimization

### Spatial Partitioning
```typescript
class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, GameEntity[]> = new Map();

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  addEntity(entity: GameEntity): void {
    const cellKey = this.getCellKey(entity.position.x, entity.position.y);
    if (!this.grid.has(cellKey)) {
      this.grid.set(cellKey, []);
    }
    this.grid.get(cellKey)!.push(entity);
  }

  getNearbyEntities(x: number, y: number, radius: number): GameEntity[] {
    const nearby: GameEntity[] = [];
    const startCellX = Math.floor((x - radius) / this.cellSize);
    const startCellY = Math.floor((y - radius) / this.cellSize);
    const endCellX = Math.floor((x + radius) / this.cellSize);
    const endCellY = Math.floor((y + radius) / this.cellSize);

    for (let cellX = startCellX; cellX <= endCellX; cellX++) {
      for (let cellY = startCellY; cellY <= endCellY; cellY++) {
        const cellKey = `${cellX},${cellY}`;
        const entities = this.grid.get(cellKey);
        if (entities) {
          nearby.push(...entities);
        }
      }
    }

    return nearby;
  }

  clear(): void {
    this.grid.clear();
  }
}
```

### Broad-Phase and Narrow-Phase Collision
```typescript
const performCollisionDetection = (entities: GameEntity[]): Collision[] => {
  const collisions: Collision[] = [];
  const spatialGrid = new SpatialGrid(100);

  // Broad phase: Spatial partitioning
  entities.forEach(entity => {
    if (entity.collider) {
      spatialGrid.addEntity(entity);
    }
  });

  // Narrow phase: Precise collision checks
  entities.forEach(entity => {
    if (!entity.collider) return;

    const nearby = spatialGrid.getNearbyEntities(
      entity.position.x,
      entity.position.y,
      entity.collider.radius * 2
    );

    nearby.forEach(other => {
      if (entity.id === other.id || !other.collider) return;

      if (checkPreciseCollision(entity, other)) {
        collisions.push({ entityA: entity, entityB: other });
      }
    });
  });

  return collisions;
};
```

## Audio Optimization

### Audio Pooling
```typescript
class AudioPool {
  private pool: Sound[] = [];
  private maxSize: number;
  private activeSounds: Set<Sound> = new Set();

  play(soundId: string): void {
    let sound = this.pool.find(s => !this.activeSounds.has(s));

    if (!sound) {
      if (this.pool.length < this.maxSize) {
        sound = this.createSound(soundId);
        this.pool.push(sound);
      } else {
        // Reuse oldest sound
        sound = this.pool[0];
        this.pool.push(this.pool.shift()!);
      }
    }

    this.activeSounds.add(sound);
    sound.play(() => {
      this.activeSounds.delete(sound);
    });
  }

  private createSound(soundId: string): Sound {
    // Load and create sound instance
    return new Sound(soundId);
  }
}
```

### Audio Quality Adaptation
```typescript
const adjustAudioQuality = (performanceLevel: PerformanceLevel): void => {
  switch (performanceLevel) {
    case 'high':
      // Full quality: 44.1kHz, stereo, reverb
      setAudioQuality(44100, true, true);
      setMaxSimultaneousSounds(16);
      break;

    case 'medium':
      // Reduced quality: 22.05kHz, mono, no reverb
      setAudioQuality(22050, false, false);
      setMaxSimultaneousSounds(8);
      break;

    case 'low':
      // Minimum quality: 11.025kHz, mono, essential sounds only
      setAudioQuality(11025, false, false);
      setMaxSimultaneousSounds(4);
      break;
  }
};
```

## Platform-Specific Optimizations

### Android Optimization
```typescript
// Android-specific optimizations
const androidOptimizations = {
  // Use hardware acceleration
  enableHardwareAcceleration: true,

  // Texture format optimization
  preferredTextureFormat: 'ETC2',

  // Memory management
  largeHeap: false, // Avoid unless necessary
  trimMemoryOnPause: true,

  // Battery optimization
  wakeLock: 'partial', // Partial wake lock for gameplay
  keepScreenOn: true,
};
```

### iOS Optimization
```typescript
// iOS-specific optimizations
const iosOptimizations = {
  // Metal API optimization
  preferMetal: true,

  // Texture format
  preferredTextureFormat: 'PVRTC',

  // Memory management
  purgeableTextures: true,
  autoPurgeTextures: true,

  // Battery optimization
  idleTimerDisabled: true, // Keep screen on
};
```

### Web Optimization
```typescript
// Web-specific optimizations
const webOptimizations = {
  // Use WebGL 2.0 if available
  webGLVersion: 2,

  // Texture format
  preferredTextureFormat: 'WEBP',

  // Memory management
  enableTextureCompression: true,

  // Performance monitoring
  enablePerformanceObserver: true,
};
```

## Adaptive Quality System

### Dynamic Quality Adjustment
```typescript
class AdaptiveQualitySystem {
  private qualityLevel: QualityLevel = 'high';
  private fpsHistory: number[] = [];
  private memoryHistory: number[] = [];

  update(currentFPS: number, currentMemory: number): void {
    // Update history
    this.fpsHistory.push(currentFPS);
    this.memoryHistory.push(currentMemory);

    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
      this.memoryHistory.shift();
    }

    // Calculate averages
    const avgFPS = this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length;
    const avgMemory = this.memoryHistory.reduce((a, b) => a + b) / this.memoryHistory.length;

    // Adjust quality based on performance
    this.adjustQuality(avgFPS, avgMemory);
  }

  private adjustQuality(fps: number, memory: number): void {
    const newLevel = this.calculateQualityLevel(fps, memory);

    if (newLevel !== this.qualityLevel) {
      this.qualityLevel = newLevel;
      this.applyQualitySettings(newLevel);
    }
  }

  private calculateQualityLevel(fps: number, memory: number): QualityLevel {
    if (fps < 45 || memory > 180) return 'low';
    if (fps < 55 || memory > 150) return 'medium';
    return 'high';
  }

  private applyQualitySettings(level: QualityLevel): void {
    switch (level) {
      case 'high':
        setParticleCount(100);
        setTextureQuality('high');
        setShadowQuality(true);
        break;

      case 'medium':
        setParticleCount(50);
        setTextureQuality('medium');
        setShadowQuality(false);
        break;

      case 'low':
        setParticleCount(20);
        setTextureQuality('low');
        setShadowQuality(false);
        break;
    }
  }
}
```

## Performance Testing

### Automated Performance Tests
```typescript
describe('Performance Tests', () => {
  test('maintains target FPS under load', async () => {
    const fpsMetrics = await measurePerformance(() => {
      // Simulate intense gameplay
      simulateGameplay({
        entityCount: 100,
        particleCount: 200,
        collisionChecks: true,
      });
    });

    expect(fpsMetrics.average).toBeGreaterThan(45);
    expect(fpsMetrics.percentile95).toBeGreaterThan(40);
    expect(fpsMetrics.dipsBelow30).toBe(0);
  });

  test('memory usage stays within limits', () => {
    const memoryMetrics = measureMemoryUsage(() => {
      // Load all game assets
      loadAllAssets();
      createGameEntities(50);
    });

    expect(memoryMetrics.peak).toBeLessThan(200 * 1024 * 1024); // 200MB
    expect(memoryMetrics.leak).toBeLessThan(10 * 1024 * 1024); // 10MB leak max
  });
});
```

### Performance Profiling
```bash
# React Native performance profiling
npm run android -- --profile

# Chrome DevTools profiling
open chrome://inspect

# Memory profiling
adb shell dumpsys meminfo com.space.shooter

# CPU profiling
adb shell top -n 1 | grep space.shooter
```

## Optimization Checklist

### Before Release Checklist
- [ ] 60fps maintained during intense gameplay
- [ ] Memory usage under 200MB peak
- [ ] No memory leaks after extended play
- [ ] Input latency under 100ms
- [ ] Adaptive quality system working
- [ ] Asset loading optimized
- [ ] Entity pooling implemented
- [ ] Spatial partitioning active
- [ ] Audio pooling working
- [ ] Platform-specific optimizations applied

### Ongoing Maintenance
- [ ] Monitor performance metrics in production
- [ ] Update optimization strategies for new devices
- [ ] Test on low-end target devices
- [ ] Profile and optimize hot paths regularly
- [ ] Keep dependencies updated for performance fixes

---

*Last Updated: 2026-02-13*
*Performance Guide Version: 1.0*
*Target: 60fps on mid-range devices, <200MB memory usage*