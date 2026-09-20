import type { ILogger } from './ILogger';

const noop = (_message: string, _context?: unknown): void => {};

const noopLogger: ILogger = {
  fatal: noop,
  error: noop,
  warn: noop,
  info: noop,
  debug: noop,
  trace: noop,
};

/**
 * A logger that discards all events. Useful in tests, benchmarks, and
 * embedded contexts where library log output is noise.
 */
export function createNoopLogger(): ILogger {
  return noopLogger;
}
