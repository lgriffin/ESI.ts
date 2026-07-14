import { RateLimiter } from '../../src/core/rateLimiter/RateLimiter';
import * as sleepModule from '../../src/core/util/sleep';

describe('RateLimiter benchmarks', () => {
  let limiter: RateLimiter;
  let sleepSpy: jest.SpyInstance;

  beforeEach(() => {
    limiter = new RateLimiter();
    limiter.setTestMode(false);
    sleepSpy = jest.spyOn(sleepModule, 'sleep').mockResolvedValue(undefined);
  });

  afterEach(() => {
    limiter.setTestMode(true);
    sleepSpy.mockRestore();
  });

  it('checkRateLimit: 10K calls under 2s', async () => {
    const start = performance.now();

    for (let i = 0; i < 10_000; i++) {
      await limiter.checkRateLimit();
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });

  it('updateFromResponse: 50 groups x 100 updates under 1s', () => {
    const start = performance.now();

    for (let g = 0; g < 50; g++) {
      for (let i = 0; i < 100; i++) {
        limiter.updateFromResponse(
          {
            'x-esi-error-limit-remain': String(100 - (i % 100)),
            'x-esi-error-limit-reset': '60',
          },
          200,
          `/v1/group-${g}/endpoint/`,
          'GET',
        );
      }
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });

  it('getStatus: 100 groups populated, 1K calls under 1s', () => {
    for (let g = 0; g < 100; g++) {
      limiter.updateFromResponse(
        {
          'x-esi-error-limit-remain': '90',
          'x-esi-error-limit-reset': '60',
        },
        200,
        `/v1/group-${g}/endpoint/`,
        'GET',
      );
    }

    const start = performance.now();

    for (let i = 0; i < 1_000; i++) {
      limiter.getStatus();
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });
});
