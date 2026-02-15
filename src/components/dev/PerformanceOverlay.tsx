/**
 * Performance Monitoring Overlay
 * Dev-only component for displaying real-time performance metrics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { perfLog } from '../../utils/Debug';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  entityCount: number;
  particleCount: number;
  collisionChecks: number;
  memoryUsage: number;
  renderTime: number;
  systemTime: number;
}

interface PerformanceOverlayProps {
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  getEntityCount?: () => number;
  getParticleCount?: () => number;
  getCollisionChecks?: () => number;
  onToggle?: () => void;
}

// Performance monitor singleton
class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private frameTime = 16.67;
  private renderTime = 0;
  private systemTime = 0;
  private listeners: Set<(metrics: PerformanceMetrics) => void> = new Set();

  startFrame(): void {
    this.lastTime = performance.now();
  }

  endFrame(): void {
    const now = performance.now();
    this.frameTime = now - this.lastTime;
    this.frameCount++;

    // Calculate FPS every second
    if (this.frameCount % 60 === 0) {
      this.fps = Math.round(1000 / this.frameTime);
    }
  }

  setRenderTime(time: number): void {
    this.renderTime = time;
  }

  setSystemTime(time: number): void {
    this.systemTime = time;
  }

  getMetrics(
    entityCount: number = 0,
    particleCount: number = 0,
    collisionChecks: number = 0
  ): PerformanceMetrics {
    return {
      fps: this.fps,
      frameTime: Math.round(this.frameTime * 100) / 100,
      entityCount,
      particleCount,
      collisionChecks,
      memoryUsage: this.getMemoryUsage(),
      renderTime: Math.round(this.renderTime * 100) / 100,
      systemTime: Math.round(this.systemTime * 100) / 100,
    };
  }

  private getMemoryUsage(): number {
    // @ts-ignore - performance.memory is not in standard types
    if (typeof performance !== 'undefined' && performance.memory) {
      // @ts-ignore
      return Math.round(performance.memory.usedJSHeapSize / 1048576);
    }
    return 0;
  }

  subscribe(listener: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(metrics: PerformanceMetrics): void {
    this.listeners.forEach(listener => listener(metrics));
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance Overlay Component
 */
export const PerformanceOverlay: React.FC<PerformanceOverlayProps> = ({
  visible = false,
  position = 'top-right',
  getEntityCount,
  getParticleCount,
  getCollisionChecks,
  onToggle,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    entityCount: 0,
    particleCount: 0,
    collisionChecks: 0,
    memoryUsage: 0,
    renderTime: 0,
    systemTime: 0,
  });
  const [isExpanded, setIsExpanded] = useState(true);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Update metrics periodically
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      const newMetrics = performanceMonitor.getMetrics(
        getEntityCount?.() || 0,
        getParticleCount?.() || 0,
        getCollisionChecks?.() || 0
      );
      setMetrics(newMetrics);

      // Check for performance warnings
      const newWarnings: string[] = [];
      if (newMetrics.fps < 30) {
        newWarnings.push('LOW FPS');
      }
      if (newMetrics.frameTime > 33) {
        newWarnings.push('SLOW FRAME');
      }
      if (newMetrics.memoryUsage > 100) {
        newWarnings.push('HIGH MEMORY');
      }
      setWarnings(newWarnings);
    }, 500);

    return () => clearInterval(interval);
  }, [visible, getEntityCount, getParticleCount, getCollisionChecks]);

  if (!visible) return null;

  const getPositionStyle = () => {
    switch (position) {
      case 'top-left':
        return { top: 60, left: 10 };
      case 'top-right':
        return { top: 60, right: 10 };
      case 'bottom-left':
        return { bottom: 100, left: 10 };
      case 'bottom-right':
        return { bottom: 100, right: 10 };
      default:
        return { top: 60, right: 10 };
    }
  };

  const getFpsColor = (fps: number) => {
    if (fps >= 55) return '#4CAF50';
    if (fps >= 30) return '#FFC107';
    return '#F44336';
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggle?.();
  };

  return (
    <View style={[styles.container, getPositionStyle()]}>
      {isExpanded ? (
        <>
          <TouchableOpacity onPress={handleToggle} style={styles.header}>
            <Text style={styles.title}>PERFORMANCE</Text>
            <Text style={styles.collapseIcon}>−</Text>
          </TouchableOpacity>

          <View style={styles.metricsContainer}>
            {/* FPS - Most important metric */}
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>FPS</Text>
              <Text style={[styles.metricValue, { color: getFpsColor(metrics.fps) }]}>
                {metrics.fps}
              </Text>
            </View>

            {/* Frame Time */}
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Frame</Text>
              <Text style={[
                styles.metricValue,
                metrics.frameTime > 33 && styles.warningText
              ]}>
                {metrics.frameTime.toFixed(1)}ms
              </Text>
            </View>

            {/* Entity Count */}
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Entities</Text>
              <Text style={styles.metricValue}>{metrics.entityCount}</Text>
            </View>

            {/* Particle Count */}
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Particles</Text>
              <Text style={styles.metricValue}>{metrics.particleCount}</Text>
            </View>

            {/* Collision Checks */}
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Collisions</Text>
              <Text style={styles.metricValue}>{metrics.collisionChecks}</Text>
            </View>

            {/* Memory Usage */}
            {metrics.memoryUsage > 0 && (
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Memory</Text>
                <Text style={[
                  styles.metricValue,
                  metrics.memoryUsage > 100 && styles.warningText
                ]}>
                  {metrics.memoryUsage}MB
                </Text>
              </View>
            )}

            {/* System Time */}
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>System</Text>
              <Text style={styles.metricValue}>{metrics.systemTime.toFixed(1)}ms</Text>
            </View>

            {/* Render Time */}
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Render</Text>
              <Text style={styles.metricValue}>{metrics.renderTime.toFixed(1)}ms</Text>
            </View>
          </View>

          {/* Warnings */}
          {warnings.length > 0 && (
            <View style={styles.warningsContainer}>
              {warnings.map((warning, index) => (
                <Text key={index} style={styles.warningText}>
                  ⚠ {warning}
                </Text>
              ))}
            </View>
          )}
        </>
      ) : (
        <TouchableOpacity onPress={handleToggle} style={styles.collapsedContainer}>
          <Text style={[styles.fpsMini, { color: getFpsColor(metrics.fps) }]}>
            {metrics.fps}
          </Text>
          <Text style={styles.fpsLabel}>FPS</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    zIndex: 1000,
    minWidth: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  collapseIcon: {
    color: '#888',
    fontSize: 12,
  },
  metricsContainer: {
    padding: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  metricLabel: {
    color: '#888',
    fontSize: 10,
    fontFamily: 'monospace',
    minWidth: 60,
  },
  metricValue: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'right',
    minWidth: 50,
  },
  warningText: {
    color: '#F44336',
  },
  warningsContainer: {
    paddingHorizontal: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 6,
  },
  collapsedContainer: {
    padding: 8,
    alignItems: 'center',
  },
  fpsMini: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  fpsLabel: {
    color: '#888',
    fontSize: 8,
    fontFamily: 'monospace',
  },
});

// Performance tracking helper
export const trackPerformance = (
  name: string,
  fn: () => void
): number => {
  const start = performance.now();
  fn();
  const elapsed = performance.now() - start;

  if (__DEV__ && elapsed > 16) {
    perfLog.warn(`${name} took ${elapsed.toFixed(2)}ms`);
  }

  return elapsed;
};

// Async performance tracking
export const trackPerformanceAsync = async (
  name: string,
  fn: () => Promise<void>
): Promise<number> => {
  const start = performance.now();
  await fn();
  const elapsed = performance.now() - start;

  if (__DEV__ && elapsed > 16) {
    perfLog.warn(`${name} took ${elapsed.toFixed(2)}ms`);
  }

  return elapsed;
};

export default PerformanceOverlay;
