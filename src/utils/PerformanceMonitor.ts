// Performance Monitor for mobile game optimization
// Tracks frame rate, memory usage, and performance metrics

import { Platform } from 'react-native';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number; // ms
  memoryUsage?: number; // MB
  entityCount: number;
  collisionChecks: number;
  renderTime: number; // ms
  updateTime: number; // ms
  batteryLevel?: number; // 0-100
  thermalState?: 'nominal' | 'fair' | 'serious' | 'critical';
}

export interface PerformanceThresholds {
  minFPS: number;
  maxFrameTime: number; // ms
  maxMemoryMB: number;
  maxEntities: number;
  maxCollisionChecks: number;
}

export type PerformanceAlert = {
  level: 'warning' | 'critical';
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
  timestamp: number;
  message: string;
};

export type PerformanceCallback = (metrics: PerformanceMetrics, alerts: PerformanceAlert[]) => void;

class PerformanceMonitor {
  private static instance: PerformanceMonitor;

  private metrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    entityCount: 0,
    collisionChecks: 0,
    renderTime: 0,
    updateTime: 0,
  };

  private thresholds: PerformanceThresholds = {
    minFPS: 30, // Minimum acceptable FPS
    maxFrameTime: 33, // Max 33ms per frame (30fps)
    maxMemoryMB: 200, // Max 200MB memory
    maxEntities: 200, // Max entities on screen
    maxCollisionChecks: 1000, // Max collision checks per frame
  };

  private frameTimes: number[] = [];
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private alerts: PerformanceAlert[] = [];
  private callbacks: PerformanceCallback[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  // Performance adaptation levels
  private adaptationLevel: number = 0; // 0 = high quality, 1 = medium, 2 = low
  private readonly ADAPTATION_CONFIGS = [
    { // Level 0: High Quality
      particleCount: 50,
      enemyDetail: 'high',
      effectsEnabled: true,
      shadowQuality: 'high',
    },
    { // Level 1: Medium Quality
      particleCount: 25,
      enemyDetail: 'medium',
      effectsEnabled: true,
      shadowQuality: 'low',
    },
    { // Level 2: Low Quality
      particleCount: 10,
      enemyDetail: 'low',
      effectsEnabled: false,
      shadowQuality: 'none',
    },
  ];

  private constructor() {
    // Initialize with platform-specific defaults
    if (Platform.OS === 'android') {
      // Android devices vary widely, be conservative
      this.thresholds.maxMemoryMB = 150;
    } else if (Platform.OS === 'ios') {
      // iOS devices have more consistent performance
      this.thresholds.maxMemoryMB = 200;
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Start monitoring performance
  startMonitoring(intervalMs: number = 1000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.lastFrameTime = Date.now();

    // Monitor frame rate
    const monitorFrame = () => {
      const now = Date.now();
      const delta = now - this.lastFrameTime;
      this.lastFrameTime = now;

      // Calculate FPS
      if (delta > 0) {
        const fps = 1000 / delta;
        this.frameTimes.push(fps);

        // Keep last 60 frames (1 second at 60fps)
        if (this.frameTimes.length > 60) {
          this.frameTimes.shift();
        }

        // Calculate average FPS
        this.metrics.fps = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        this.metrics.frameTime = delta;
      }

      this.frameCount++;

      // Check memory periodically (every 60 frames)
      if (this.frameCount % 60 === 0) {
        this.checkMemoryUsage();
        this.checkPerformance();
      }
    };

    // Use requestAnimationFrame for accurate frame timing
    const animate = () => {
      if (!this.isMonitoring) return;
      monitorFrame();
      requestAnimationFrame(animate);
    };

    animate();

    // Periodic checks
    this.monitoringInterval = setInterval(() => {
      this.analyzePerformance();
    }, intervalMs);

    console.log('Performance monitoring started');
  }

  // Stop monitoring
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('Performance monitoring stopped');
  }

  // Update game-specific metrics
  updateGameMetrics(metrics: Partial<PerformanceMetrics>): void {
    this.metrics = { ...this.metrics, ...metrics };
    this.checkThresholds();
  }

  // Check memory usage (platform-specific)
  private checkMemoryUsage(): void {
    // Note: React Native doesn't provide direct memory access
    // This is a placeholder - in production, you might use:
    // - React Native Performance Monitor
    // - Custom native modules
    // - Estimation based on asset sizes

    // For now, we'll estimate based on entity count
    const estimatedMemoryPerEntity = 1024; // 1KB per entity (rough estimate)
    this.metrics.memoryUsage = (this.metrics.entityCount * estimatedMemoryPerEntity) / (1024 * 1024); // Convert to MB

    // Add base memory for assets
    this.metrics.memoryUsage += 50; // 50MB base for game assets
  }

  // Check performance thresholds
  private checkThresholds(): void {
    const newAlerts: PerformanceAlert[] = [];
    const now = Date.now();

    // Check FPS
    if (this.metrics.fps < this.thresholds.minFPS) {
      newAlerts.push({
        level: this.metrics.fps < 20 ? 'critical' : 'warning',
        metric: 'fps',
        value: this.metrics.fps,
        threshold: this.thresholds.minFPS,
        timestamp: now,
        message: `Low FPS: ${this.metrics.fps.toFixed(1)} (min: ${this.thresholds.minFPS})`,
      });
    }

    // Check frame time
    if (this.metrics.frameTime > this.thresholds.maxFrameTime) {
      newAlerts.push({
        level: this.metrics.frameTime > 50 ? 'critical' : 'warning',
        metric: 'frameTime',
        value: this.metrics.frameTime,
        threshold: this.thresholds.maxFrameTime,
        timestamp: now,
        message: `High frame time: ${this.metrics.frameTime.toFixed(1)}ms (max: ${this.thresholds.maxFrameTime}ms)`,
      });
    }

    // Check memory
    if (this.metrics.memoryUsage && this.metrics.memoryUsage > this.thresholds.maxMemoryMB) {
      newAlerts.push({
        level: 'critical',
        metric: 'memoryUsage',
        value: this.metrics.memoryUsage,
        threshold: this.thresholds.maxMemoryMB,
        timestamp: now,
        message: `High memory usage: ${this.metrics.memoryUsage.toFixed(1)}MB (max: ${this.thresholds.maxMemoryMB}MB)`,
      });
    }

    // Check entity count
    if (this.metrics.entityCount > this.thresholds.maxEntities) {
      newAlerts.push({
        level: 'warning',
        metric: 'entityCount',
        value: this.metrics.entityCount,
        threshold: this.thresholds.maxEntities,
        timestamp: now,
        message: `High entity count: ${this.metrics.entityCount} (max: ${this.thresholds.maxEntities})`,
      });
    }

    // Check collision checks
    if (this.metrics.collisionChecks > this.thresholds.maxCollisionChecks) {
      newAlerts.push({
        level: 'warning',
        metric: 'collisionChecks',
        value: this.metrics.collisionChecks,
        threshold: this.thresholds.maxCollisionChecks,
        timestamp: now,
        message: `High collision checks: ${this.metrics.collisionChecks} (max: ${this.thresholds.maxCollisionChecks})`,
      });
    }

    // Update alerts
    this.alerts = newAlerts;

    // Notify callbacks
    if (newAlerts.length > 0) {
      this.callbacks.forEach(callback => {
        callback(this.metrics, newAlerts);
      });
    }
  }

  // Analyze performance and adapt if needed
  private analyzePerformance(): void {
    const { fps, frameTime } = this.metrics;

    // Determine if we need to adapt quality
    let newAdaptationLevel = this.adaptationLevel;

    if (fps < 25 || frameTime > 40) {
      // Performance is poor, increase adaptation level
      newAdaptationLevel = Math.min(this.adaptationLevel + 1, 2);
    } else if (fps > 55 && frameTime < 20 && this.adaptationLevel > 0) {
      // Performance is good, try to improve quality
      newAdaptationLevel = Math.max(this.adaptationLevel - 1, 0);
    }

    // Apply adaptation if changed
    if (newAdaptationLevel !== this.adaptationLevel) {
      this.adaptationLevel = newAdaptationLevel;
      this.applyAdaptation();
    }

    // Log performance summary
    this.logPerformanceSummary();
  }

  // Apply performance adaptation
  private applyAdaptation(): void {
    const config = this.ADAPTATION_CONFIGS[this.adaptationLevel];

    console.log(`Applying performance adaptation level ${this.adaptationLevel}:`, config);

    // Here you would apply the adaptation to your game systems
    // For example:
    // - Reduce particle count
    // - Simplify enemy rendering
    // - Disable visual effects
    // - Reduce shadow quality

    // Dispatch adaptation event
    this.callbacks.forEach(callback => {
      // You might want to create a separate event for adaptations
    });
  }

  // Log performance summary
  private logPerformanceSummary(): void {
    const { fps, frameTime, entityCount, memoryUsage } = this.metrics;

    console.log(
      `Performance: ${fps.toFixed(1)} FPS, ` +
      `${frameTime.toFixed(1)}ms/frame, ` +
      `${entityCount} entities, ` +
      `${memoryUsage?.toFixed(1)}MB memory, ` +
      `Adaptation: ${this.adaptationLevel}`
    );
  }

  // Check overall performance and suggest optimizations
  private checkPerformance(): void {
    const suggestions: string[] = [];

    if (this.metrics.entityCount > 100) {
      suggestions.push('Consider implementing object pooling for entities');
    }

    if (this.metrics.collisionChecks > 500) {
      suggestions.push('Optimize collision detection with spatial partitioning');
    }

    if (this.metrics.renderTime > 10) {
      suggestions.push('Reduce render complexity or implement render batching');
    }

    if (this.metrics.updateTime > 10) {
      suggestions.push('Optimize game logic or spread updates across frames');
    }

    if (suggestions.length > 0) {
      console.log('Performance suggestions:', suggestions);
    }
  }

  // Register callback for performance updates
  addCallback(callback: PerformanceCallback): void {
    this.callbacks.push(callback);
  }

  // Remove callback
  removeCallback(callback: PerformanceCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get current alerts
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  // Get adaptation configuration
  getAdaptationConfig(): any {
    return this.ADAPTATION_CONFIGS[this.adaptationLevel];
  }

  // Get adaptation level
  getAdaptationLevel(): number {
    return this.adaptationLevel;
  }

  // Set custom thresholds
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  // Reset metrics
  reset(): void {
    this.metrics = {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      entityCount: 0,
      collisionChecks: 0,
      renderTime: 0,
      updateTime: 0,
    };
    this.frameTimes = [];
    this.frameCount = 0;
    this.alerts = [];
  }

  // Generate performance report
  generateReport(): string {
    const { fps, frameTime, entityCount, memoryUsage, renderTime, updateTime } = this.metrics;

    return `
Performance Report:
===================
FPS: ${fps.toFixed(1)} (target: 60)
Frame Time: ${frameTime.toFixed(1)}ms
Entities: ${entityCount}
Memory: ${memoryUsage?.toFixed(1)}MB
Render Time: ${renderTime.toFixed(1)}ms
Update Time: ${updateTime.toFixed(1)}ms
Adaptation Level: ${this.adaptationLevel}
Alerts: ${this.alerts.length}
${this.alerts.map(alert => `  - ${alert.message}`).join('\n')}
    `.trim();
  }
}

// Singleton instance export
export const performanceMonitor = PerformanceMonitor.getInstance();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  return performanceMonitor;
};

// Helper to measure execution time
export const measureTime = <T>(label: string, fn: () => T): T => {
  const start = Date.now();
  const result = fn();
  const end = Date.now();

  const duration = end - start;
  if (duration > 16) { // More than 1 frame at 60fps
    console.warn(`Slow operation "${label}": ${duration}ms`);
  }

  return result;
};

// Performance profiling decorator
export function profileMethod(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function(...args: any[]) {
    const start = Date.now();
    const result = originalMethod.apply(this, args);
    const end = Date.now();

    const duration = end - start;
    if (duration > 10) {
      console.log(`Method ${propertyKey} took ${duration}ms`);
    }

    return result;
  };

  return descriptor;
}