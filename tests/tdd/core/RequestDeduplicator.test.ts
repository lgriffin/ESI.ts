import { RequestDeduplicator } from '../../../src/core/RequestDeduplicator';

describe('RequestDeduplicator', () => {
  let dedup: RequestDeduplicator;

  beforeEach(() => {
    dedup = new RequestDeduplicator();
  });

  describe('dedupe', () => {
    it('should execute the function and return its result', async () => {
      const result = await dedup.dedupe('key1', async () => 'hello');
      expect(result).toBe('hello');
    });

    it('should coalesce concurrent identical requests', async () => {
      let callCount = 0;
      const execute = () =>
        new Promise<string>((resolve) => {
          callCount++;
          setTimeout(() => resolve('result'), 50);
        });

      const [r1, r2, r3] = await Promise.all([
        dedup.dedupe('same-key', execute),
        dedup.dedupe('same-key', execute),
        dedup.dedupe('same-key', execute),
      ]);

      expect(callCount).toBe(1);
      expect(r1).toBe('result');
      expect(r2).toBe('result');
      expect(r3).toBe('result');
    });

    it('should not coalesce requests with different keys', async () => {
      let callCount = 0;
      const execute = () =>
        new Promise<number>((resolve) => {
          callCount++;
          resolve(callCount);
        });

      const [r1, r2] = await Promise.all([
        dedup.dedupe('key-a', execute),
        dedup.dedupe('key-b', execute),
      ]);

      expect(callCount).toBe(2);
      expect(r1).not.toBe(r2);
    });

    it('should clean up after resolution', async () => {
      expect(dedup.pending).toBe(0);

      await dedup.dedupe('key1', async () => 'done');

      expect(dedup.pending).toBe(0);
    });

    it('should allow new request after previous one completes', async () => {
      let callCount = 0;
      const execute = async () => ++callCount;

      await dedup.dedupe('key1', execute);
      await dedup.dedupe('key1', execute);

      expect(callCount).toBe(2);
    });

    it('should propagate errors to all waiters', async () => {
      const execute = () => Promise.reject(new Error('boom'));

      const results = await Promise.allSettled([
        dedup.dedupe('key1', execute),
        dedup.dedupe('key1', execute),
      ]);

      expect(results[0].status).toBe('rejected');
      expect(results[1].status).toBe('rejected');
      expect((results[0] as PromiseRejectedResult).reason.message).toBe('boom');
      expect((results[1] as PromiseRejectedResult).reason.message).toBe('boom');
    });

    it('should clean up after rejection', async () => {
      const execute = () => Promise.reject(new Error('fail'));

      await dedup.dedupe('key1', execute).catch(() => {});

      expect(dedup.pending).toBe(0);
    });
  });

  describe('pending', () => {
    it('should track in-flight requests', async () => {
      let resolveFirst!: () => void;
      const first = new Promise<void>((r) => {
        resolveFirst = r;
      });

      const promise = dedup.dedupe('key1', () => first);
      expect(dedup.pending).toBe(1);

      resolveFirst();
      await promise;
      expect(dedup.pending).toBe(0);
    });

    it('should track multiple keys independently', async () => {
      let resolve1!: () => void;
      let resolve2!: () => void;
      const p1 = new Promise<void>((r) => {
        resolve1 = r;
      });
      const p2 = new Promise<void>((r) => {
        resolve2 = r;
      });

      const d1 = dedup.dedupe('a', () => p1);
      const d2 = dedup.dedupe('b', () => p2);
      expect(dedup.pending).toBe(2);

      resolve1();
      await d1;
      expect(dedup.pending).toBe(1);

      resolve2();
      await d2;
      expect(dedup.pending).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear in-flight map', () => {
      dedup.dedupe('key1', () => new Promise(() => {}));
      expect(dedup.pending).toBe(1);

      dedup.clear();
      expect(dedup.pending).toBe(0);
    });
  });
});
