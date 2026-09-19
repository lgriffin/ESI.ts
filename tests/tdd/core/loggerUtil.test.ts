import {
  setLogger,
  getLogger,
  logInfo,
  logError,
  logWarn,
  logDebug,
  logFatal,
  logTrace,
} from '../../../src/core/logger/loggerUtil';
import { ILogger } from '../../../src/core/logger/ILogger';
import { logCalls, spyLogger } from '../helpers/spyLogger';

describe('loggerUtil', () => {
  const originalLogger = getLogger();

  afterEach(() => {
    setLogger(originalLogger);
  });

  it('should swap to a custom logger via setLogger', () => {
    const customLogger: ILogger = {
      fatal: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
    };

    setLogger(customLogger);

    logInfo('info message');
    logError('error message');
    logWarn('warn message');
    logDebug('debug message');

    expect(customLogger.info).toHaveBeenCalledWith('info message', undefined);
    expect(customLogger.error).toHaveBeenCalledWith('error message', undefined);
    expect(customLogger.warn).toHaveBeenCalledWith('warn message', undefined);
    expect(customLogger.debug).toHaveBeenCalledWith('debug message', undefined);
  });

  it('sends fatal and trace to their own levels, context intact', () => {
    const logger = spyLogger();
    setLogger(logger);

    logFatal('boom', { endpoint: 'status' });
    logTrace('t', { attempt: 2 });

    expect(logCalls(logger)).toEqual([
      ['fatal', 'boom', { endpoint: 'status' }],
      ['trace', 't', { attempt: 2 }],
    ]);
  });

  it('passes a non-empty context through and an empty one as undefined', () => {
    const logger = spyLogger();
    setLogger(logger);

    logInfo('with', { status: 200 });
    logInfo('empty', {});

    expect(logger.info.mock.calls).toEqual([
      ['with', { status: 200 }],
      ['empty', undefined],
    ]);
  });

  it('should return the active logger via getLogger', () => {
    const customLogger: ILogger = {
      fatal: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
    };

    setLogger(customLogger);
    expect(getLogger()).toBe(customLogger);
  });
});
