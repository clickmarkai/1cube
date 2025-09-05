/**
 * Application Logger
 * Unifies logging and silences non-error logs in production by default.
 *
 * Configure via env vars (client-safe):
 * - NEXT_PUBLIC_LOG_LEVEL: 'silent' | 'error' | 'warn' | 'info' | 'debug'
 *
 * Defaults:
 * - development: debug
 * - production: error
 */

type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

const levelPriority: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

function getEnvLogLevel(): LogLevel {
  const nodeEnv = process.env.NODE_ENV;
  const envLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL || '').toLowerCase();

  if (envLevel === 'silent' || envLevel === 'error' || envLevel === 'warn' || envLevel === 'info' || envLevel === 'debug') {
    return envLevel as LogLevel;
  }

  // Defaults by environment
  return nodeEnv === 'production' ? 'error' : 'debug';
}

const activeLevel: LogLevel = getEnvLogLevel();

function shouldLog(level: LogLevel): boolean {
  if (activeLevel === 'silent') return false;
  return levelPriority[level] <= levelPriority[activeLevel];
}

function formatMessage(namespace: string | undefined, messages: unknown[]): unknown[] {
  if (!namespace) return messages;
  return [`[${namespace}]`, ...messages];
}

export interface Logger {
  debug: (namespace: string | undefined, ...args: unknown[]) => void;
  info: (namespace: string | undefined, ...args: unknown[]) => void;
  warn: (namespace: string | undefined, ...args: unknown[]) => void;
  error: (namespace: string | undefined, ...args: unknown[]) => void;
  create: (namespace: string) => ScopedLogger;
}

export interface ScopedLogger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

function makeLogger(): Logger {
  const base: Logger = {
    debug(namespace, ...args) {
      if (!shouldLog('debug')) return;
      // Prefer console.debug where available
      if (typeof console !== 'undefined' && console.debug) {
        console.debug(...formatMessage(namespace, args));
      } else if (typeof console !== 'undefined') {
        console.log(...formatMessage(namespace, args));
      }
    },
    info(namespace, ...args) {
      if (!shouldLog('info')) return;
      if (typeof console !== 'undefined' && console.info) {
        console.info(...formatMessage(namespace, args));
      } else if (typeof console !== 'undefined') {
        console.log(...formatMessage(namespace, args));
      }
    },
    warn(namespace, ...args) {
      if (!shouldLog('warn')) return;
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(...formatMessage(namespace, args));
      } else if (typeof console !== 'undefined') {
        console.log(...formatMessage(namespace, args));
      }
    },
    error(namespace, ...args) {
      // Errors always log unless active level is 'silent'
      if (!shouldLog('error')) return;
      if (typeof console !== 'undefined' && console.error) {
        console.error(...formatMessage(namespace, args));
      } else if (typeof console !== 'undefined') {
        console.log(...formatMessage(namespace, args));
      }
    },
    create(ns: string): ScopedLogger {
      return {
        debug: (...args: unknown[]) => base.debug(ns, ...args),
        info: (...args: unknown[]) => base.info(ns, ...args),
        warn: (...args: unknown[]) => base.warn(ns, ...args),
        error: (...args: unknown[]) => base.error(ns, ...args),
      };
    },
  };
  return base;
}

export const logger: Logger = makeLogger();

// Convenience: namespaced helpers
export const appLogger = logger.create('app');
export const perfLogger = logger.create('perf');
export const navLogger = logger.create('nav');
export const routerLogger = logger.create('router');
export const channelsLogger = logger.create('channels');
export const teamLogger = logger.create('team');
export const aiLogger = logger.create('ai');


