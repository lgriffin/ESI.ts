import pino from 'pino';
import { logDebug, logWarn } from '../../../src/core/logger/clientLog';
import { toPinoLogger } from '../../../src/core/logger/DefaultLogger';
import type { ILogger, LoggerLevel } from '../../../src/core/logger/ILogger';
import {
  getLogger,
  logDebug as globalDebug,
  logWarn as globalWarn,
  setLogger,
} from '../../../src/core/logger/loggerUtil';
import { createNoopLogger } from '../../../src/core/logger/NoopLogger';
import type { ApiClient } from '../../../src/core/ApiClient';
import { ETagCacheManager } from '../../../src/core/cache/ETagCacheManager';

function gatedLogger(enabled: readonly LoggerLevel[]): {
  logger: ILogger;
  lines: string[];
} {
  const lines: string[] = [];
  const record = (message: string): void => {
    lines.push(message);
  };
  return {
    lines,
    logger: {
      fatal: record,
      error: record,
      warn: record,
      info: record,
      debug: record,
      trace: record,
      isLevelEnabled: (level) => enabled.includes(level),
    },
  };
}

const clientWith = (logger: ILogger): ApiClient =>
  ({ getLogger: () => logger }) as unknown as ApiClient;

describe('ILogger.isLevelEnabled', () => {
  const original = getLogger();
  afterEach(() => setLogger(original));

  it('skips a line whose level the client logger reports disabled', () => {
    const { logger, lines } = gatedLogger(['warn']);
    const client = clientWith(logger);
    logDebug(client, 'dropped https://x/?token=a');
    logWarn(client, 'kept https://x/?token=a');
    expect(lines).toEqual(['kept https://x/?token=%5BREDACTED%5D']);
  });

  it('skips a line whose level the global logger reports disabled', () => {
    const { logger, lines } = gatedLogger(['warn']);
    setLogger(logger);
    globalDebug('dropped');
    globalWarn('kept');
    expect(lines).toEqual(['kept']);
  });

  it('delivers every line to a logger without the method', () => {
    const lines: string[] = [];
    const record = (message: string): void => {
      lines.push(message);
    };
    const logger: ILogger = {
      fatal: record,
      error: record,
      warn: record,
      info: record,
      debug: record,
      trace: record,
    };
    logDebug(clientWith(logger), 'debug line');
    expect(lines).toEqual(['debug line']);
  });

  it('reports every level disabled on the no-op logger', () => {
    expect(createNoopLogger().isLevelEnabled?.('fatal')).toBe(false);
  });

  it('follows the level of the pino logger it adapts, including later changes', () => {
    const p = pino({ level: 'warn' });
    const logger = toPinoLogger(p);
    expect(logger.isLevelEnabled?.('debug')).toBe(false);
    expect(logger.isLevelEnabled?.('warn')).toBe(true);
    expect(logger.isLevelEnabled?.('fatal')).toBe(true);
    p.level = 'debug';
    expect(logger.isLevelEnabled?.('debug')).toBe(true);
    expect(logger.isLevelEnabled?.('trace')).toBe(false);
  });

  it('falls back to the sink own isLevelEnabled when it has no numeric level', () => {
    const noop = (): void => {};
    const logger = toPinoLogger({
      fatal: noop,
      error: noop,
      warn: noop,
      info: noop,
      debug: noop,
      trace: noop,
      isLevelEnabled: (level) => level === 'error',
    });
    expect(logger.isLevelEnabled?.('error')).toBe(true);
    expect(logger.isLevelEnabled?.('info')).toBe(false);
  });

  it('leaves isLevelEnabled off a sink that has neither', () => {
    const noop = (): void => {};
    const logger = toPinoLogger({
      fatal: noop,
      error: noop,
      warn: noop,
      info: noop,
      debug: noop,
      trace: noop,
    });
    expect(logger.isLevelEnabled).toBeUndefined();
  });
});

// #543: the cache's per-request debug lines are built only when debug is on.
describe('ETagCacheManager debug lines', () => {
  const url = 'https://esi.evetech.net/status/';

  const exercise = (enabled: readonly LoggerLevel[]): string[] => {
    const { logger, lines } = gatedLogger(enabled);
    const cache = new ETagCacheManager({}, clientWith(logger));
    try {
      cache.set(url, '"etag-1"', { players: 1 }, {});
      cache.get(url);
    } finally {
      cache.shutdown();
    }
    return lines.filter((line) => line.includes(url));
  };

  it('writes the set and hit lines when the client logger has debug on', () => {
    expect(exercise(['info', 'debug'])).toEqual([
      `Cached response for ${url} with ETag "etag-1"`,
      `Cache hit for ${url} with ETag "etag-1"`,
    ]);
  });

  it('writes neither line when the client logger has debug off', () => {
    expect(exercise(['info'])).toEqual([]);
  });
});
