import { createConsoleLogger } from '../../../src';

describe('createConsoleLogger', () => {
  let log: jest.SpyInstance;
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;
  const savedLevel = process.env.ESI_LOG_LEVEL;

  beforeEach(() => {
    delete process.env.ESI_LOG_LEVEL;
    log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (savedLevel === undefined) delete process.env.ESI_LOG_LEVEL;
    else process.env.ESI_LOG_LEVEL = savedLevel;
  });

  it('writes info lines unprefixed to console.log', () => {
    createConsoleLogger('info').info('Players online: 30,000');
    expect(log).toHaveBeenCalledWith('Players online: 30,000');
  });

  it('prefixes other levels and routes them by severity', () => {
    const logger = createConsoleLogger('trace');
    logger.trace('t');
    logger.debug('d');
    logger.warn('w');
    logger.error('e');
    logger.fatal('f');
    expect(log.mock.calls).toEqual([['trace: t'], ['debug: d']]);
    expect(warn).toHaveBeenCalledWith('warn: w');
    expect(error.mock.calls).toEqual([['error: e'], ['fatal: f']]);
  });

  it('appends context as [key=value] tokens', () => {
    createConsoleLogger('info').error('Request failed', {
      error: new Error('timed out'),
      status: 504,
      endpoint: '/status',
      body: { a: 1 },
    });
    expect(error).toHaveBeenCalledWith(
      'error: Request failed [error=timed out] [status=504] [endpoint=/status] [body={"a":1}]',
    );
  });

  it('does not throw on a context value JSON cannot serialise', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() =>
      createConsoleLogger('info').info('x', { circular, n: 10n }),
    ).not.toThrow();
    expect(log).toHaveBeenCalledWith('x [circular=[unserialisable]] [n=10]');
  });

  it('drops lines below its level and reports that through isLevelEnabled', () => {
    const logger = createConsoleLogger('warn');
    logger.info('hidden');
    logger.debug('hidden');
    logger.warn('shown');
    expect(log).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('warn: shown');
    expect(logger.isLevelEnabled?.('info')).toBe(false);
    expect(logger.isLevelEnabled?.('error')).toBe(true);
  });

  it('writes nothing at silent', () => {
    const logger = createConsoleLogger('silent');
    logger.fatal('hidden');
    expect(error).not.toHaveBeenCalled();
  });

  it('defaults to ESI_LOG_LEVEL, then warn, like createDefaultLogger', () => {
    createConsoleLogger().info('hidden');
    expect(log).not.toHaveBeenCalled();
    process.env.ESI_LOG_LEVEL = 'debug';
    createConsoleLogger().debug('shown');
    expect(log).toHaveBeenCalledWith('debug: shown');
  });

  it('falls back to warn for an unknown level instead of throwing', () => {
    process.env.ESI_LOG_LEVEL = 'loud';
    const logger = createConsoleLogger();
    logger.info('hidden');
    logger.warn('shown');
    expect(log).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('warn: shown');
  });
});
