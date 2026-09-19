import {
  logDebug,
  logError,
  logFatal,
  logInfo,
  logTrace,
  logWarn,
} from '../../../src/core/logger/clientLog';
import { defaultLogger } from '../../../src/core/logger/DefaultLogger';
import { getLogger, setLogger } from '../../../src/core/logger/loggerUtil';
import { resolveLogger } from '../../../src/core/logger/resolveLogger';
import type { ApiClient } from '../../../src/core/ApiClient';
import { clientWithLogger, logCalls, spyLogger } from '../helpers/spyLogger';

const asClient = (c: ReturnType<typeof clientWithLogger>) =>
  c as unknown as ApiClient;

describe('clientLog', () => {
  const original = getLogger();
  afterEach(() => setLogger(original));

  it.each([
    ['fatal', logFatal],
    ['error', logError],
    ['warn', logWarn],
    ['info', logInfo],
    ['debug', logDebug],
    ['trace', logTrace],
  ] as const)(
    'sends %s to that level of the client logger, context intact',
    (level, log) => {
      const logger = spyLogger();

      log(asClient(clientWithLogger(logger)), 'm', { endpoint: 'status' });

      expect(logCalls(logger)).toEqual([[level, 'm', { endpoint: 'status' }]]);
    },
  );

  it('passes no context rather than an empty object', () => {
    const logger = spyLogger();

    logInfo(asClient(clientWithLogger(logger)), 'm', {});
    logInfo(asClient(clientWithLogger(logger)), 'n');

    expect(logger.info.mock.calls).toEqual([
      ['m', undefined],
      ['n', undefined],
    ]);
  });

  it('falls back to the global logger when the client has none', () => {
    const global = spyLogger();
    setLogger(global);

    logWarn(asClient(clientWithLogger(null)), 'w', { status: 429 });
    logWarn(null, 'x');

    expect(global.warn.mock.calls).toEqual([
      ['w', { status: 429 }],
      ['x', undefined],
    ]);
  });
});

describe('resolveLogger', () => {
  const original = getLogger();
  afterEach(() => setLogger(original));

  it('prefers the client logger over a global one', () => {
    const own = spyLogger();
    setLogger(spyLogger());

    expect(resolveLogger(clientWithLogger(own))).toBe(own);
  });

  it('uses a global logger installed with setLogger when the client has none', () => {
    const global = spyLogger();
    setLogger(global);

    expect(resolveLogger(null)).toBe(global);
    expect(resolveLogger(undefined)).toBe(global);
    expect(resolveLogger(clientWithLogger(null))).toBe(global);
    expect(resolveLogger({})).toBe(global);
  });

  it('uses the built-in default when nothing else is set', () => {
    setLogger(defaultLogger);

    expect(resolveLogger(null)).toBe(defaultLogger);
  });
});
