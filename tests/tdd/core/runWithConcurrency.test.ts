import { runWithConcurrency } from '../../../src/core/util/concurrency';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('runWithConcurrency', () => {
  it('returns an empty array for no items without invoking the worker', async () => {
    const worker = jest.fn();
    const results = await runWithConcurrency([], worker);
    expect(results).toEqual([]);
    expect(worker).not.toHaveBeenCalled();
  });

  it('returns fulfilled results in input order regardless of completion order', async () => {
    const delays = [30, 5, 15];
    const results = await runWithConcurrency(
      delays,
      async (d) => {
        await sleep(d);
        return d * 2;
      },
      { concurrency: 3 },
    );
    expect(results).toEqual([
      { status: 'fulfilled', value: 60 },
      { status: 'fulfilled', value: 10 },
      { status: 'fulfilled', value: 30 },
    ]);
  });

  it('captures rejections without aborting the other items', async () => {
    const results = await runWithConcurrency([1, 2, 3], async (n) => {
      if (n === 2) throw new Error('boom');
      return n;
    });
    expect(results[0]).toEqual({ status: 'fulfilled', value: 1 });
    expect(results[1]!.status).toBe('rejected');
    expect((results[1] as { reason: Error }).reason.message).toBe('boom');
    expect(results[2]).toEqual({ status: 'fulfilled', value: 3 });
  });

  it('never runs more than the configured number of workers at once', async () => {
    let inFlight = 0;
    let peak = 0;
    await runWithConcurrency(
      Array.from({ length: 12 }, (_, i) => i),
      async () => {
        inFlight++;
        peak = Math.max(peak, inFlight);
        await sleep(5);
        inFlight--;
      },
      { concurrency: 4 },
    );
    expect(peak).toBeLessThanOrEqual(4);
    expect(peak).toBeGreaterThan(1);
  });

  it('treats a concurrency below one as one', async () => {
    let inFlight = 0;
    let peak = 0;
    await runWithConcurrency(
      [1, 2, 3],
      async () => {
        inFlight++;
        peak = Math.max(peak, inFlight);
        await sleep(2);
        inFlight--;
      },
      { concurrency: 0 },
    );
    expect(peak).toBe(1);
  });

  it('defaults to five workers', async () => {
    let inFlight = 0;
    let peak = 0;
    await runWithConcurrency(
      Array.from({ length: 20 }, (_, i) => i),
      async () => {
        inFlight++;
        peak = Math.max(peak, inFlight);
        await sleep(5);
        inFlight--;
      },
    );
    expect(peak).toBe(5);
  });

  it('reports progress after each item settles', async () => {
    const progress: Array<[number, number]> = [];
    await runWithConcurrency(
      [1, 2, 3],
      async (n) => {
        if (n === 3) throw new Error('x');
        return n;
      },
      { concurrency: 1, onProgress: (c, t) => progress.push([c, t]) },
    );
    expect(progress).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
  });

  it('passes the item index to the worker', async () => {
    const seen: number[] = [];
    await runWithConcurrency(['a', 'b'], async (_item, index) => {
      seen.push(index);
    });
    expect(seen.sort()).toEqual([0, 1]);
  });
});
