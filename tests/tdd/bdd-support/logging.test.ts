import { loggedText, recordingLogger } from '../../bdd/support/logging';

describe('loggedText (tests/bdd/support/logging.ts)', () => {
  const SECRET = 'bdd-access-token';

  it('finds a token in a nested Authorization header', () => {
    const logger = recordingLogger();
    logger.debug('request', {
      request: { headers: { Authorization: `Bearer ${SECRET}` } },
    });
    expect(loggedText(logger).some((t) => t.includes(SECRET))).toBe(true);
  });

  it('finds a token inside arrays, Maps, Sets and an Error cause', () => {
    const cases: unknown[] = [
      [{ headers: [['authorization', `Bearer ${SECRET}`]] }],
      new Map([['authorization', `Bearer ${SECRET}`]]),
      new Set([`Bearer ${SECRET}`]),
      new Error('refresh failed', { cause: new Error(SECRET) }),
    ];
    for (const value of cases) {
      const logger = recordingLogger();
      logger.warn('line', { value });
      expect(loggedText(logger).some((t) => t.includes(SECRET))).toBe(true);
    }
  });

  it('stops at a cycle and reports no token that was never logged', () => {
    const logger = recordingLogger();
    const context: Record<string, unknown> = { endpoint: 'status' };
    context.self = context;
    logger.info('Hitting endpoint', context);
    expect(loggedText(logger)).toEqual([
      'Hitting endpoint',
      'endpoint',
      'status',
      'self',
    ]);
  });
});
