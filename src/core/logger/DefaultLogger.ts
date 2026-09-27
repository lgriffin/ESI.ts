import pino from 'pino';
import type { ILogger, LogContext, LoggerLevel } from './ILogger';

/**
 * The default `ILogger` implementation — a thin wrapper around pino.
 *
 * Level resolution (highest precedence first):
 * 1. `level` passed to `createDefaultLogger` (e.g. from
 *    `EsiClientConfig.logLevel`).
 * 2. The `ESI_LOG_LEVEL` environment variable.
 * 3. `'warn'` (library default — quiet unless the app opts in).
 *
 * The logger writes to `process.stdout` and can be swapped entirely via
 * `EsiClientConfig.logger` or the global `setLogger()` fallback.
 */
export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

/**
 * An `ILogger` whose methods are plain functions that ignore `this`, so they
 * can be copied onto another object. `toPinoLogger` builds one.
 */
type DetachedLogger = {
  [L in LoggerLevel]: (message: string, context?: LogContext) => void;
} & { isLevelEnabled?: (level: LoggerLevel) => boolean };

export function createDefaultLogger(level?: string): ILogger {
  return buildDefaultLogger(level);
}

function buildDefaultLogger(level?: string): DetachedLogger {
  const resolved = level || process.env.ESI_LOG_LEVEL || 'warn';
  return adaptPino(pino({ level: resolved }));
}

/**
 * Adapt any pino-compatible logger (pino, pino-http child, custom sink) to the
 * `ILogger` contract. Context objects are spread onto the log event so they
 * appear as structured fields rather than being stringified into the message.
 */
export function toPinoLogger(p: {
  fatal: (...a: unknown[]) => void;
  error: (...a: unknown[]) => void;
  warn: (...a: unknown[]) => void;
  info: (...a: unknown[]) => void;
  debug: (...a: unknown[]) => void;
  trace: (...a: unknown[]) => void;
  isLevelEnabled?: ((level: string) => boolean) | undefined;
  levelVal?: number | undefined;
  levels?: { values: Record<string, number> } | undefined;
}): ILogger {
  return adaptPino(p);
}

function adaptPino(p: Parameters<typeof toPinoLogger>[0]): DetachedLogger {
  // Call through the sink object so pino methods keep their `this` binding.
  const emit =
    (level: LogLevel) =>
    (message: string, context?: LogContext): void =>
      context ? p[level](context, message) : p[level](message);
  const logger: DetachedLogger = {
    fatal: emit('fatal'),
    error: emit('error'),
    warn: emit('warn'),
    info: emit('info'),
    debug: emit('debug'),
    trace: emit('trace'),
  };
  const values = p.levels?.values;
  if (values && typeof p.levelVal === 'number') {
    // pino's own isLevelEnabled costs more than the line it would skip; the
    // numeric comparison reads the current level, so a later change applies.
    logger.isLevelEnabled = (level) =>
      (values[level] ?? Infinity) >= (p.levelVal ?? -Infinity);
  } else if (typeof p.isLevelEnabled === 'function') {
    logger.isLevelEnabled = (level) => p.isLevelEnabled?.(level) ?? true;
  }
  return logger;
}

const LEVELS: readonly LoggerLevel[] = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
];

/**
 * An `ILogger` that builds its pino logger on first use: the first call to a
 * level method or to `isLevelEnabled`. Nothing is constructed when the module
 * loads, so importing the package starts no pino instance (CHARTER ARCH-06)
 * and `ESI_LOG_LEVEL` is read when the first line is logged, not at import.
 *
 * On that first call the object replaces its own methods with the built
 * logger's, so every later call goes straight to pino with no extra hop.
 * The object's identity never changes, so it can be held and compared.
 */
export function createLazyDefaultLogger(): ILogger {
  const lazy = {} as DetachedLogger;
  // Cached so a caller that saved a method before first use (`const warn =
  // logger.warn`) reaches the same pino instance on every call.
  let built: DetachedLogger | undefined;
  const materialise = (): DetachedLogger => {
    if (built) return built;
    const real = buildDefaultLogger();
    built = real;
    for (const level of LEVELS) lazy[level] = real[level];
    lazy.isLevelEnabled = real.isLevelEnabled ?? ((): boolean => true);
    return real;
  };
  for (const level of LEVELS) {
    lazy[level] = (message: string, context?: LogContext): void =>
      materialise()[level](message, context);
  }
  lazy.isLevelEnabled = (level: LoggerLevel): boolean =>
    materialise().isLevelEnabled?.(level) ?? true;
  return lazy;
}

/**
 * Backwards-compatible default instance (level from `ESI_LOG_LEVEL`). Built
 * lazily: the pino logger behind it is constructed on its first use.
 */
export const defaultLogger: ILogger = createLazyDefaultLogger();
