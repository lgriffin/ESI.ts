import { RequestDeduplicator } from '../../../src/core/RequestDeduplicator';
import { batchFetch } from '../../../src/core/BatchRequestHandler';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import * as sleepModule from '../../../src/core/util/sleep';

describe('Concurrency', () => {
  describe('RequestDeduplicator', () => {
    it('executes the function only once for 100 concurrent calls with the same key', async () => {
      const dedup = new RequestDeduplicator();
      let execCount = 0;

      const execute = async () => {
        execCount++;
        await Promise.resolve();
        return 'result';
      };

      const promises = Array.from({ length: 100 }, () =>
        dedup.dedupe('same-key', execute),
      );
      const results = await Promise.all(promises);

      expect(execCount).toBe(1);
      expect(results).toHaveLength(100);
      results.forEach((r) => expect(r).toBe('result'));
    });

    it('executes once per key for 50 calls across 10 keys', async () => {
      const dedup = new RequestDeduplicator();
      const execCounts = new Map<string, number>();

      const promises = Array.from({ length: 50 }, (_, i) => {
        const key = `key-${i % 10}`;
        return dedup.dedupe(key, async () => {
          execCounts.set(key, (execCounts.get(key) ?? 0) + 1);
          await Promise.resolve();
          return key;
        });
      });

      await Promise.all(promises);

      expect(execCounts.size).toBe(10);
      for (const [, count] of execCounts) {
        expect(count).toBe(1);
      }
    });

    it('propagates errors to all concurrent callers', async () => {
      const dedup = new RequestDeduplicator();
      const error = new Error('boom');

      const promises = Array.from({ length: 20 }, () =>
        dedup.dedupe('fail-key', async () => {
          throw error;
        }),
      );

      const results = await Promise.allSettled(promises);
      expect(results).toHaveLength(20);
      results.forEach((r) => {
        expect(r.status).toBe('rejected');
        if (r.status === 'rejected') {
          expect(r.reason).toBe(error);
        }
      });
    });

    it('clears pending state after completion', async () => {
      const dedup = new RequestDeduplicator();

      await dedup.dedupe('key', async () => 'first');
      expect(dedup.pending).toBe(0);

      let secondExecCount = 0;
      await dedup.dedupe('key', async () => {
        secondExecCount++;
        return 'second';
      });
      expect(secondExecCount).toBe(1);
    });
  });

  describe('batchFetch', () => {
    it('completes two simultaneous batch operations independently', async () => {
      const keys1 = [1, 2, 3];
      const keys2 = [4, 5, 6];

      const [result1, result2] = await Promise.all([
        batchFetch(keys1, async (k) => k * 10),
        batchFetch(keys2, async (k) => k * 100),
      ]);

      expect(result1.results.size).toBe(3);
      expect(result1.results.get(1)).toBe(10);
      expect(result1.results.get(2)).toBe(20);
      expect(result1.results.get(3)).toBe(30);

      expect(result2.results.size).toBe(3);
      expect(result2.results.get(4)).toBe(400);
      expect(result2.results.get(5)).toBe(500);
      expect(result2.results.get(6)).toBe(600);
    });

    it('correctly separates results and errors with interleaved resolution', async () => {
      const keys = [1, 2, 3, 4, 5];

      const result = await batchFetch(keys, async (k) => {
        if (k % 2 === 0) throw new Error(`failed-${k}`);
        return k * 10;
      });

      expect(result.results.size).toBe(3);
      expect(result.errors.size).toBe(2);
      expect(result.results.get(1)).toBe(10);
      expect(result.results.get(3)).toBe(30);
      expect(result.results.get(5)).toBe(50);
      expect(result.errors.get(2)).toBeInstanceOf(Error);
      expect(result.errors.get(4)).toBeInstanceOf(Error);
    });

    it('reports monotonically increasing progress', async () => {
      const keys = Array.from({ length: 20 }, (_, i) => i);
      const progressValues: number[] = [];

      await batchFetch(keys, async (k) => k, {
        concurrency: 5,
        onProgress: (completed) => {
          progressValues.push(completed);
        },
      });

      expect(progressValues).toHaveLength(20);
      for (let i = 1; i < progressValues.length; i++) {
        expect(progressValues[i]).toBeGreaterThan(progressValues[i - 1]!);
      }
      expect(progressValues[progressValues.length - 1]).toBe(20);
    });

    it('handles empty keys array', async () => {
      const result = await batchFetch([], async () => 'unreachable');
      expect(result.results.size).toBe(0);
      expect(result.errors.size).toBe(0);
    });
  });

  describe('RateLimiter', () => {
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

    it('resolves all 50 concurrent checkRateLimit calls when not blocked', async () => {
      const promises = Array.from({ length: 50 }, () =>
        limiter.checkRateLimit(),
      );
      const results = await Promise.allSettled(promises);

      results.forEach((r) => {
        expect(r.status).toBe('fulfilled');
      });
    });

    it('maintains group isolation under concurrent access', async () => {
      limiter.updateFromResponse(
        {
          'x-esi-error-limit-remain': '5',
          'x-esi-error-limit-reset': '60',
        },
        429,
        '/v1/characters/{character_id}/notifications/',
        'GET',
      );

      const unrelatedPromises = Array.from({ length: 10 }, () =>
        limiter.checkRateLimit('/v1/markets/{region_id}/orders/', 'GET'),
      );

      const results = await Promise.allSettled(unrelatedPromises);
      results.forEach((r) => {
        expect(r.status).toBe('fulfilled');
      });
    });

    it('handles concurrent updateFromResponse and checkRateLimit', async () => {
      const operations: Promise<void>[] = [];

      for (let i = 0; i < 50; i++) {
        if (i % 2 === 0) {
          operations.push(limiter.checkRateLimit());
        } else {
          operations.push(
            Promise.resolve().then(() => {
              limiter.updateFromResponse(
                {
                  'x-esi-error-limit-remain': String(100 - i),
                  'x-esi-error-limit-reset': '60',
                },
                200,
                '/v1/status/',
                'GET',
              );
            }),
          );
        }
      }

      const results = await Promise.allSettled(operations);
      results.forEach((r) => {
        expect(r.status).toBe('fulfilled');
      });
    });
  });
});
