/**
 * A logger whose every method is a jest.fn, and a minimal client that hands it
 * out, for asserting exactly what reaches a caller's logger.
 *
 * Roughly 40% of the surviving mutants in src/core (esi-23g.56) change only a
 * log message, its level or its context object. Those reach the logger a
 * consumer sets with `client.setLogger` or `EsiClientConfig.logger`, so they
 * are observable behaviour, and asserting them means asserting the exact
 * (message, context) pair on the right method, not that "something was
 * logged".
 */
import type { ILogger } from '../../../src/core/logger/ILogger';

export type SpyLogger = jest.Mocked<ILogger>;

export function spyLogger(): SpyLogger {
  return {
    fatal: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
  };
}

/**
 * The shape the pipeline's log helpers read a per-client logger from
 * (`resolveLogger` calls `client.getLogger()`). Cast it where a function
 * wants a full ApiClient.
 */
export function clientWithLogger(logger: ILogger | null): {
  getLogger: () => ILogger | null;
} {
  return { getLogger: () => logger };
}

/** Every call made to any level, as `[level, message, context]`, in order. */
export function logCalls(
  logger: SpyLogger,
): Array<[keyof ILogger, string, unknown]> {
  const levels: Array<keyof ILogger> = [
    'fatal',
    'error',
    'warn',
    'info',
    'debug',
    'trace',
  ];
  return levels
    .flatMap((level) =>
      logger[level].mock.calls.map(
        (call, index) =>
          [
            logger[level].mock.invocationCallOrder[index] ?? 0,
            level,
            call[0],
            call[1],
          ] as const,
      ),
    )
    .sort((a, b) => a[0] - b[0])
    .map(([, level, message, context]) => [level, message, context]);
}
