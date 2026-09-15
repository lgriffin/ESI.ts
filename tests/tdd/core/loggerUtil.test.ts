import {
  setLogger,
  getLogger,
  logInfo,
  logError,
  logWarn,
  logDebug,
} from '../../../src/core/logger/loggerUtil';
import { ILogger } from '../../../src/core/logger/ILogger';

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
