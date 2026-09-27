import pino from 'pino';
import type { ILogger, LogContext } from './ILogger';

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

export function createDefaultLogger(level?: string): ILogger {
  const resolved = level || process.env.ESI_LOG_LEVEL || 'warn';
  const pinoLogger = pino({ level: resolved });
  return toPinoLogger(pinoLogger);
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
  // Call through the sink object so pino methods keep their `this` binding.
  const emit =
    (level: LogLevel) =>
    (message: string, context?: LogContext): void =>
      context ? p[level](context, message) : p[level](message);
  const logger: ILogger = {
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

/** Backwards-compatible default instance (level from `ESI_LOG_LEVEL`). */
export const defaultLogger: ILogger = createDefaultLogger();
