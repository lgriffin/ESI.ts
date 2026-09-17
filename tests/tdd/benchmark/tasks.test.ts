import { tasks } from '../../../tests/benchmark/tasks';
import { summarise, percentile } from '../../../tests/benchmark/summary';

/**
 * The benchmark job runs only when hot paths change, so a task that stopped
 * working would otherwise go unnoticed until then. Every task must set up,
 * run and tear down here, on every pull request.
 */
describe('benchmark task catalogue', () => {
  it('has unique, stable-looking names', () => {
    const names = tasks.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(name).toMatch(/^[a-z-]+\/\S/);
  });

  it.each(tasks.map((t) => [t.name, t] as const))(
    '%s sets up and runs',
    async (_name, task) => {
      const { fn, teardown } = await task.setup();
      expect(typeof fn).toBe('function');
      let completed = 0;
      try {
        for (let i = 0; i < 3; i++) {
          const result = fn();
          if (result instanceof Promise) await result;
          completed++;
        }
      } finally {
        teardown?.();
      }
      expect(completed).toBe(3);
    },
  );
});

describe('benchmark sample summary', () => {
  it('reports mean, nearest-rank percentiles and the margin of error', () => {
    const samples = Array.from({ length: 100 }, (_, i) => i + 1);
    const summary = summarise(samples);
    expect(summary.mean).toBe(50.5);
    expect(summary.p50).toBe(50);
    expect(summary.p75).toBe(75);
    expect(summary.p99).toBe(99);
    expect(summary.samples).toBe(100);
    // t(99) ≈ 1.96; sd of 1..100 is 29.01; sem 2.901; rme 11.26%.
    expect(summary.rme).toBeCloseTo(11.26, 1);
  });

  it('handles a single sample and an empty set', () => {
    expect(summarise([7])).toMatchObject({ mean: 7, p99: 7, rme: 0 });
    expect(percentile([], 0.5)).toBeNaN();
  });
});
