import {
  createDefaultLogger,
  toPinoLogger,
} from '../../../src/core/logger/DefaultLogger';
import type { LoggerLevel } from '../../../src/core/logger/ILogger';

const LEVELS: readonly LoggerLevel[] = [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
];

type Sink = Parameters<typeof toPinoLogger>[0];

/** A pino-compatible sink whose level methods record their arguments. */
function recordingSink(extra: Partial<Sink> = {}): Sink & {
  calls: unknown[][];
} {
  const calls: unknown[][] = [];
  const at =
    (level: string) =>
    (...args: unknown[]): void => {
      calls.push([level, ...args]);
    };
  return {
    calls,
    fatal: at('fatal'),
    error: at('error'),
    warn: at('warn'),
    info: at('info'),
    debug: at('debug'),
    trace: at('trace'),
    ...extra,
  };
}

describe('createDefaultLogger level resolution', () => {
  const savedEnv = process.env.ESI_LOG_LEVEL;

  afterEach(() => {
    if (savedEnv === undefined) delete process.env.ESI_LOG_LEVEL;
    else process.env.ESI_LOG_LEVEL = savedEnv;
  });

  const enabled = (level?: string): LoggerLevel[] => {
    const logger = createDefaultLogger(level);
    return LEVELS.filter((at) => logger.isLevelEnabled?.(at));
  };

  it('uses the level it is given', () => {
    delete process.env.ESI_LOG_LEVEL;
    expect(enabled('debug')).toEqual([
      'debug',
      'info',
      'warn',
      'error',
      'fatal',
    ]);
    expect(enabled('error')).toEqual(['error', 'fatal']);
  });

  it('prefers the given level over ESI_LOG_LEVEL', () => {
    process.env.ESI_LOG_LEVEL = 'trace';
    expect(enabled('error')).toEqual(['error', 'fatal']);
  });

  it('reads ESI_LOG_LEVEL when no level is given', () => {
    process.env.ESI_LOG_LEVEL = 'debug';
    expect(enabled()).toEqual(['debug', 'info', 'warn', 'error', 'fatal']);
  });

  it('defaults to warn when neither is set', () => {
    delete process.env.ESI_LOG_LEVEL;
    expect(enabled()).toEqual(['warn', 'error', 'fatal']);
  });
});

describe('toPinoLogger', () => {
  it('passes the message alone when there is no context', () => {
    const sink = recordingSink();
    const logger = toPinoLogger(sink);
    for (const level of LEVELS) logger[level](`${level} line`);
    expect(sink.calls).toEqual(LEVELS.map((level) => [level, `${level} line`]));
  });

  it('passes the context first, as pino structured fields, then the message', () => {
    const sink = recordingSink();
    toPinoLogger(sink).warn('Retrying', { attempt: 2 });
    expect(sink.calls).toEqual([['warn', { attempt: 2 }, 'Retrying']]);
  });

  it('asks the sink when it has level values but no numeric current level', () => {
    const sink = recordingSink({
      levels: {
        values: {
          trace: 10,
          debug: 20,
          info: 30,
          warn: 40,
          error: 50,
          fatal: 60,
        },
      },
      isLevelEnabled: (level) => level === 'fatal',
    });
    const logger = toPinoLogger(sink);
    expect(logger.isLevelEnabled?.('error')).toBe(false);
    expect(logger.isLevelEnabled?.('fatal')).toBe(true);
  });

  it('treats a level the sink gives no answer for as enabled', () => {
    const sink = recordingSink({
      isLevelEnabled: (() => undefined) as unknown as (
        level: string,
      ) => boolean,
    });
    expect(toPinoLogger(sink).isLevelEnabled?.('debug')).toBe(true);
  });
});
