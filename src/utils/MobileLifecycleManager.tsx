// Mobile Lifecycle Manager for handling mobile-specific events
// Manages app state, interruptions, battery, and orientation

import React from 'react';
import { AppState, AppStateStatus, Dimensions, Platform, NativeEventSubscription, EmitterSubscription } from 'react-native';
import { performanceMonitor } from './PerformanceMonitor';

export type AppStateEvent = 'active' | 'background' | 'inactive' | 'unknown';
export type InterruptionType = 'call' | 'notification' | 'alarm' | 'other';
export type Orientation = 'portrait' | 'landscape';

export interface LifecycleState {
  appState: AppStateStatus;
  isGamePaused: boolean;
  lastSaveTime: number;
  batteryLevel?: number;
  thermalState?: string;
  orientation: Orientation;
  isLowPowerMode: boolean;
  lastInterruption?: {
    type: InterruptionType;
    timestamp: number;
    duration: number;
  };
}

export interface LifecycleCallback {
  onAppStateChange?: (state: AppStateStatus) => void;
  onGamePause?: () => void;
  onGameResume?: () => void;
  onInterruptionStart?: (type: InterruptionType) => void;
  onInterruptionEnd?: (type: InterruptionType, duration: number) => void;
  onLowMemoryWarning?: () => void;
  onBatteryLow?: (level: number) => void;
  onOrientationChange?: (orientation: Orientation) => void;
  onSaveGameState?: () => Promise<void>;
  onLoadGameState?: () => Promise<void>;
}

class MobileLifecycleManager {
  private static instance: MobileLifecycleManager;

  private state: LifecycleState = {
    appState: 'active',
    isGamePaused: false,
    lastSaveTime: Date.now(),
    orientation: 'portrait',
    isLowPowerMode: false,
  };

  private callbacks: LifecycleCallback[] = [];
  private isInitialized: boolean = false;
  private interruptionStartTime: number = 0;
  private currentInterruption?: InterruptionType;

  // Auto-save interval (5 minutes)
  private autoSaveInterval = 5 * 60 * 1000;
  private autoSaveTimer: NodeJS.Timeout | null = null;

  private appStateSubscription: NativeEventSubscription | null = null;
  private dimensionsSubscription: EmitterSubscription | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): MobileLifecycleManager {
    if (!MobileLifecycleManager.instance) {
      MobileLifecycleManager.instance = new MobileLifecycleManager();
    }
    return MobileLifecycleManager.instance;
  }

  // Initialize lifecycle manager
  initialize(): void {
    if (this.isInitialized) return;

    console.log('Initializing Mobile Lifecycle Manager...');

    // Set up app state listener
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

    // Set up orientation listener
    this.dimensionsSubscription = Dimensions.addEventListener('change', this.handleOrientationChange);

    // Set up auto-save timer
    this.startAutoSave();

    // Platform-specific initialization
    if (Platform.OS === 'ios') {
      this.initializeIOS();
    } else if (Platform.OS === 'android') {
      this.initializeAndroid();
    }

    this.isInitialized = true;
    console.log('Mobile Lifecycle Manager initialized');
  }

  // Clean up resources
  cleanup(): void {
    if (!this.isInitialized) return;

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    if (this.dimensionsSubscription) {
      this.dimensionsSubscription.remove();
      this.dimensionsSubscription = null;
    }

    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    this.isInitialized = false;
    console.log('Mobile Lifecycle Manager cleaned up');
  }

  // Register callback
  registerCallback(callback: LifecycleCallback): void {
    this.callbacks.push(callback);
  }

  // Unregister callback
  unregisterCallback(callback: LifecycleCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  // Handle app state changes
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    const prevAppState = this.state.appState;
    this.state.appState = nextAppState;

    console.log(`App state changed: ${prevAppState} -> ${nextAppState}`);

    // Notify callbacks
    this.callbacks.forEach(callback => {
      callback.onAppStateChange?.(nextAppState);
    });

    // Handle game pause/resume
    this.handleGameStateChange(prevAppState, nextAppState);

    // Handle interruptions
    this.handleInterruption(prevAppState, nextAppState);
  };

  // Handle game pause/resume based on app state
  private handleGameStateChange(prevState: AppStateStatus, nextState: AppStateStatus): void {
    const wasActive = prevState === 'active';
    const isActive = nextState === 'active';

    if (wasActive && !isActive) {
      // App going to background/inactive
      this.pauseGame();
    } else if (!wasActive && isActive) {
      // App becoming active
      this.resumeGame();
    }
  }

  // Handle interruptions (calls, notifications, etc.)
  private handleInterruption(prevState: AppStateStatus, nextState: AppStateStatus): void {
    // Detect interruption start (app going inactive while not in background)
    if (prevState === 'active' && nextState === 'inactive') {
      this.startInterruption('other');
    }

    // Detect interruption end
    if (prevState === 'inactive' && nextState === 'active') {
      this.endInterruption();
    }
  }

  // Start an interruption
  startInterruption(type: InterruptionType): void {
    this.currentInterruption = type;
    this.interruptionStartTime = Date.now();

    console.log(`Interruption started: ${type}`);

    // Notify callbacks
    this.callbacks.forEach(callback => {
      callback.onInterruptionStart?.(type);
    });

    // Pause game if not already paused
    if (!this.state.isGamePaused) {
      this.pauseGame();
    }
  }

  // End an interruption
  endInterruption(): void {
    if (!this.currentInterruption) return;

    const duration = Date.now() - this.interruptionStartTime;
    const type = this.currentInterruption;

    console.log(`Interruption ended: ${type} (duration: ${duration}ms)`);

    // Notify callbacks
    this.callbacks.forEach(callback => {
      callback.onInterruptionEnd?.(type, duration);
    });

    // Resume game if it was paused by interruption
    if (this.state.isGamePaused) {
      this.resumeGame();
    }

    this.currentInterruption = undefined;
    this.interruptionStartTime = 0;
  }

  // Pause the game
  pauseGame(): void {
    if (this.state.isGamePaused) return;

    this.state.isGamePaused = true;
    console.log('Game paused');

    // Save game state
    this.saveGameState();

    // Stop performance monitoring to save battery
    performanceMonitor.stopMonitoring();

    // Notify callbacks
    this.callbacks.forEach(callback => {
      callback.onGamePause?.();
    });
  }

  // Resume the game
  resumeGame(): void {
    if (!this.state.isGamePaused) return;

    this.state.isGamePaused = false;
    console.log('Game resumed');

    // Restart performance monitoring
    performanceMonitor.startMonitoring();

    // Notify callbacks
    this.callbacks.forEach(callback => {
      callback.onGameResume?.();
    });
  }

  // Save game state
  async saveGameState(): Promise<void> {
    console.log('Saving game state...');

    try {
      // Notify callbacks to save their state
      const savePromises = this.callbacks
        .filter(callback => callback.onSaveGameState)
        .map(callback => callback.onSaveGameState!());

      await Promise.all(savePromises);

      this.state.lastSaveTime = Date.now();
      console.log('Game state saved successfully');
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }

  // Load game state
  async loadGameState(): Promise<void> {
    console.log('Loading game state...');

    try {
      // Notify callbacks to load their state
      const loadPromises = this.callbacks
        .filter(callback => callback.onLoadGameState)
        .map(callback => callback.onLoadGameState!());

      await Promise.all(loadPromises);
      console.log('Game state loaded successfully');
    } catch (error) {
      console.error('Failed to load game state:', error);
    }
  }

  // Handle orientation changes
  private handleOrientationChange = (): void => {
    const { width, height } = Dimensions.get('window');
    const newOrientation: Orientation = width > height ? 'landscape' : 'portrait';

    if (newOrientation !== this.state.orientation) {
      const oldOrientation = this.state.orientation;
      this.state.orientation = newOrientation;

      console.log(`Orientation changed: ${oldOrientation} -> ${newOrientation}`);

      // Notify callbacks
      this.callbacks.forEach(callback => {
        callback.onOrientationChange?.(newOrientation);
      });

      // For Space Shooter, we might want to:
      // - Adjust UI layout
      // - Recalculate touch areas
      // - Adjust game camera/field of view
    }
  };

  // Start auto-save timer
  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      this.saveGameState();
    }, this.autoSaveInterval);

    console.log(`Auto-save enabled (every ${this.autoSaveInterval / 1000 / 60} minutes)`);
  }

  // Handle low memory warning
  handleLowMemoryWarning(): void {
    console.warn('Low memory warning received');

    // Notify callbacks
    this.callbacks.forEach(callback => {
      callback.onLowMemoryWarning?.();
    });

    // Take action to free memory
    this.freeMemory();
  }

  // Free memory when needed
  private freeMemory(): void {
    console.log('Freeing memory...');

    // Actions to free memory:
    // 1. Clear asset caches
    // 2. Reduce entity count
    // 3. Dispose of unused resources
    // 4. Reduce particle effects

    // Notify performance monitor to adapt
    performanceMonitor.updateGameMetrics({
      entityCount: Math.max(0, performanceMonitor.getMetrics().entityCount - 20),
    });

    console.log('Memory freed');
  }

  // Update battery level
  updateBatteryLevel(level: number): void {
    this.state.batteryLevel = level;

    // Check if battery is low
    if (level < 20) {
      console.warn(`Low battery: ${level}%`);

      // Notify callbacks
      this.callbacks.forEach(callback => {
        callback.onBatteryLow?.(level);
      });

      // Enable battery-saving mode
      this.enableBatterySaving();
    }
  }

  // Enable battery-saving mode
  private enableBatterySaving(): void {
    if (this.state.isLowPowerMode) return;

    this.state.isLowPowerMode = true;
    console.log('Battery-saving mode enabled');

    // Actions for battery saving:
    // 1. Reduce frame rate target
    // 2. Reduce visual effects
    // 3. Lower audio quality
    // 4. Reduce particle count

    // Update performance thresholds
    performanceMonitor.setThresholds({
      minFPS: 30, // Lower target FPS
    });
  }

  // Disable battery-saving mode
  disableBatterySaving(): void {
    if (!this.state.isLowPowerMode) return;

    this.state.isLowPowerMode = false;
    console.log('Battery-saving mode disabled');

    // Restore normal performance thresholds
    performanceMonitor.setThresholds({
      minFPS: 60,
    });
  }

  // iOS-specific initialization
  private initializeIOS(): void {
    console.log('Initializing iOS-specific lifecycle features');

    // iOS-specific features:
    // - Background audio session management
    // - Thermal state monitoring
    // - Low power mode detection
    // - Interruption handling

    // Note: Some features require native modules
    // For now, we'll set up placeholders
  }

  // Android-specific initialization
  private initializeAndroid(): void {
    console.log('Initializing Android-specific lifecycle features');

    // Android-specific features:
    // - Doze mode awareness
    // - Battery optimization handling
    // - Memory pressure handling
    // - Foreground service for game (if needed)

    // Note: Some features require native modules
  }

  // Get current lifecycle state
  getState(): LifecycleState {
    return { ...this.state };
  }

  // Check if game is paused
  isGamePaused(): boolean {
    return this.state.isGamePaused;
  }

  // Check if app is in background
  isInBackground(): boolean {
    return this.state.appState === 'background';
  }

  // Check if app is active
  isActive(): boolean {
    return this.state.appState === 'active';
  }

  // Get current orientation
  getOrientation(): Orientation {
    return this.state.orientation;
  }

  // Manually trigger game pause (for testing or UI)
  manualPause(): void {
    this.pauseGame();
  }

  // Manually trigger game resume
  manualResume(): void {
    this.resumeGame();
  }

  // Force save game state
  forceSave(): Promise<void> {
    return this.saveGameState();
  }

  // Force load game state
  forceLoad(): Promise<void> {
    return this.loadGameState();
  }
}

// Singleton instance export
export const mobileLifecycleManager = MobileLifecycleManager.getInstance();

// React hook for lifecycle management
export const useMobileLifecycle = () => {
  return mobileLifecycleManager;
};

// Helper to create a lifecycle-aware component
export const withLifecycle = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  lifecycleCallbacks?: LifecycleCallback
): React.ComponentType<P> => {
  return class LifecycleAwareComponent extends React.Component<P> {
    componentDidMount() {
      mobileLifecycleManager.initialize();
      if (lifecycleCallbacks) {
        mobileLifecycleManager.registerCallback(lifecycleCallbacks);
      }
    }

    componentWillUnmount() {
      if (lifecycleCallbacks) {
        mobileLifecycleManager.unregisterCallback(lifecycleCallbacks);
      }
      mobileLifecycleManager.cleanup();
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
};