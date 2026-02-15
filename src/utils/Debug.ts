/**
 * Debug Utility Module
 * Provides conditional logging that only runs in development mode.
 * This prevents console.log statements from impacting production performance.
 */

declare const __DEV__: boolean;

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface DebugOptions {
  /** Prefix to add to all log messages */
  prefix?: string;
  /** Whether to include timestamps */
  timestamp?: boolean;
}

/**
 * Debug logger that only outputs in development mode
 */
class DebugLogger {
  private prefix: string;
  private timestamp: boolean;

  constructor(options: DebugOptions = {}) {
    this.prefix = options.prefix || '[Game]';
    this.timestamp = options.timestamp || false;
  }

  private formatMessage(...args: unknown[]): unknown[] {
    const formatted: unknown[] = [this.prefix];

    if (this.timestamp) {
      formatted.push(`[${new Date().toISOString()}]`);
    }

    return [...formatted, ...args];
  }

  /**
   * Log informational messages (dev only)
   */
  log(...args: unknown[]): void {
    if (__DEV__) {
      console.log(...this.formatMessage(...args));
    }
  }

  /**
   * Log warning messages (dev only)
   */
  warn(...args: unknown[]): void {
    if (__DEV__) {
      console.warn(...this.formatMessage(...args));
    }
  }

  /**
   * Log info messages (dev only)
   */
  info(...args: unknown[]): void {
    if (__DEV__) {
      console.info(...this.formatMessage(...args));
    }
  }

  /**
   * Log debug messages (dev only)
   */
  debug(...args: unknown[]): void {
    if (__DEV__) {
      console.debug(...this.formatMessage(...args));
    }
  }

  /**
   * Log error messages (always shown, even in production)
   */
  error(...args: unknown[]): void {
    // Always log errors, but consider using a crash reporting service in production
    console.error(...this.formatMessage(...args));
  }

  /**
   * Start a timing operation
   */
  time(label: string): void {
    if (__DEV__) {
      console.time(`${this.prefix} ${label}`);
    }
  }

  /**
   * End a timing operation
   */
  timeEnd(label: string): void {
    if (__DEV__) {
      console.timeEnd(`${this.prefix} ${label}`);
    }
  }

  /**
   * Log a table of data (dev only)
   */
  table(data: unknown): void {
    if (__DEV__) {
      console.table(data);
    }
  }

  /**
   * Create a group of logged messages (dev only)
   */
  group(label: string): void {
    if (__DEV__) {
      console.group(`${this.prefix} ${label}`);
    }
  }

  /**
   * End a group of logged messages (dev only)
   */
  groupEnd(): void {
    if (__DEV__) {
      console.groupEnd();
    }
  }
}

// Create default logger instance
export const debug = new DebugLogger({ prefix: '[Game]' });

// Create module-specific loggers
export const createLogger = (prefix: string): DebugLogger => {
  return new DebugLogger({ prefix: `[${prefix}]` });
};

// Pre-configured loggers for common modules
export const gameLog = createLogger('Game');
export const audioLog = createLogger('Audio');
export const assetLog = createLogger('Asset');
export const perfLog = createLogger('Perf');
export const systemLog = createLogger('System');

export default debug;
