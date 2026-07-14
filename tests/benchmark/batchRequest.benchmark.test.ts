import { batchFetch, batchPost } from '../../src/core/BatchRequestHandler';

describe('BatchRequestHandler benchmarks', () => {
  it('batchFetch: 1K keys at concurrency 20 under 2s', async () => {
    const keys = Array.from({ length: 1_000 }, (_, i) => i);

    const start = performance.now();

    const result = await batchFetch(keys, async (k) => k * 10, {
      concurrency: 20,
    });

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
    expect(result.results.size).toBe(1000);
    expect(result.errors.size).toBe(0);
  });

  it('batchFetch: 10K keys at concurrency 50 under 5s', async () => {
    const keys = Array.from({ length: 10_000 }, (_, i) => i);

    const start = performance.now();

    const result = await batchFetch(keys, async (k) => k, { concurrency: 50 });

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5000);
    expect(result.results.size).toBe(10_000);
  });

  it('batchFetch: scheduling overhead with instant fetchers', async () => {
    const keys = Array.from({ length: 5_000 }, (_, i) => i);

    const start = performance.now();

    await batchFetch(keys, async (k) => k, { concurrency: 100 });

    const elapsed = performance.now() - start;
    const perKeyMs = elapsed / keys.length;
    expect(perKeyMs).toBeLessThan(1);
  });

  it('batchPost: 10K IDs in chunks of 1000 under 2s', async () => {
    const ids = Array.from({ length: 10_000 }, (_, i) => i);

    const start = performance.now();

    const result = await batchPost(
      ids,
      async (chunk) => chunk.map((id) => ({ id, name: `item-${id}` })),
      1000,
    );

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
    expect(result).toHaveLength(10_000);
  });

  it('batchFetch with progress tracking: no overhead', async () => {
    const keys = Array.from({ length: 2_000 }, (_, i) => i);
    let progressCalls = 0;

    const start = performance.now();

    await batchFetch(keys, async (k) => k, {
      concurrency: 20,
      onProgress: () => {
        progressCalls++;
      },
    });

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(3000);
    expect(progressCalls).toBe(2000);
  });
});
