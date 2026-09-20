import { createNoopLogger } from '../../../src/core/logger/NoopLogger';
import type { ILogger } from '../../../src/core/logger/ILogger';

describe('createNoopLogger', () => {
  let logger: ILogger;

  beforeEach(() => {
    logger = createNoopLogger();
  });

  it('should implement ILogger interface', () => {
    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.debug).toBeDefined();
  });

  it('should not throw when calling any log method', () => {
    expect(() => logger.info('test message')).not.toThrow();
    expect(() => logger.warn('test warning')).not.toThrow();
    expect(() => logger.error('test error')).not.toThrow();
    expect(() => logger.debug('test debug')).not.toThrow();
  });

  it('should produce no output', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation();
    const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation();

    logger.info('should not appear');
    logger.warn('should not appear');
    logger.error('should not appear');
    logger.debug('should not appear');

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(stderrSpy).not.toHaveBeenCalled();
    expect(stdoutSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
    stderrSpy.mockRestore();
    stdoutSpy.mockRestore();
  });
});
