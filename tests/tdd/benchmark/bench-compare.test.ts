import {
  bootstrapRatioCi,
  compareRuns,
  holm,
  mannWhitney,
  median,
  normalCdf,
  renderMarkdown,
  seededRandom,
} from '../../../scripts/bench-compare-core';
import type {
  HarnessResult,
  TaskSummary,
} from '../../../tests/benchmark/summary';

/** A process result whose tasks report the given per-process medians. */
function run(label: string, medians: Record<string, number>): HarnessResult {
  const tasks: Record<string, TaskSummary> = {};
  for (const [name, p50] of Object.entries(medians)) {
    tasks[name] = {
      mean: p50 * 1.02,
      p50,
      p75: p50 * 1.05,
      p99: p50 * 1.4,
      rme: 1.5,
      samples: 200,
    };
  }
  return { label, node: 'v20', platform: 'linux-x64', minCpuMs: 200, tasks };
}

/** Standard normal draws (Box–Muller) from a seeded generator. */
function gaussian(seed: number): () => number {
  const random = seededRandom(seed);
  return () =>
    Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
}

/**
 * `rounds` process results for one side: every task centred on its value
 * with multiplicative noise of `noise` (a standard deviation, e.g. 0.05).
 */
function side(
  label: string,
  centres: Record<string, number>,
  rounds: number,
  noise: number,
  seed: number,
): HarnessResult[] {
  const draw = gaussian(seed);
  return Array.from({ length: rounds }, () =>
    run(
      label,
      Object.fromEntries(
        Object.entries(centres).map(([name, centre]) => [
          name,
          centre * (1 + noise * draw()),
        ]),
      ),
    ),
  );
}

const CATALOGUE = {
  'schema/large-array': 450_000,
  'cache/get hit': 85,
  'headers/parse': 1_700,
  'pipeline/GET small': 22_000,
};

describe('benchmark comparison statistics', () => {
  describe('Mann–Whitney U', () => {
    it('gives the exact tail probability for fully separated samples', () => {
      const result = mannWhitney([1, 2, 3], [4, 5, 6]);
      expect(result.exact).toBe(true);
      expect(result.u).toBe(9);
      // One arrangement of C(6,3) = 20 puts every b above every a.
      expect(result.pGreater).toBeCloseTo(1 / 20, 12);
      expect(result.pLess).toBe(1);
    });

    it('matches the exact distribution for interleaved samples', () => {
      // U = 6 for m = n = 3; P(U >= 6) = 7/20 from the U(3,3) table.
      const result = mannWhitney([1, 3, 5], [2, 4, 6]);
      expect(result.u).toBe(6);
      expect(result.pGreater).toBeCloseTo(7 / 20, 12);
    });

    it('falls back to the tie-corrected normal approximation on ties', () => {
      const result = mannWhitney([1, 2, 2, 3], [2, 3, 4, 5]);
      expect(result.exact).toBe(false);
      expect(result.pGreater).toBeGreaterThan(0);
      expect(result.pGreater).toBeLessThan(0.2);
    });

    it('reports no evidence either way for identical samples', () => {
      const result = mannWhitney([5, 5, 5], [5, 5, 5]);
      expect(result.pGreater).toBe(1);
      expect(result.pLess).toBe(1);
    });
  });

  it('adjusts p-values with Holm step-down, in input order', () => {
    const adjusted = holm([0.01, 0.04, 0.03, 0.005]);
    [0.03, 0.06, 0.06, 0.02].forEach((expected, i) =>
      expect(adjusted[i]).toBeCloseTo(expected, 12),
    );
  });

  it('computes the normal CDF to table accuracy', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 7);
    expect(normalCdf(1.959964)).toBeCloseTo(0.975, 6);
    expect(normalCdf(-2.326348)).toBeCloseTo(0.01, 6);
  });

  it('bootstraps a ratio interval that is reproducible and brackets the truth', () => {
    const base = [100, 102, 98, 101, 99, 100, 103, 97];
    const head = base.map((v) => v * 1.3);
    const first = bootstrapRatioCi(base, head, 2000, 7);
    expect(bootstrapRatioCi(base, head, 2000, 7)).toEqual(first);
    expect(first[0]).toBeLessThanOrEqual(1.3);
    expect(first[1]).toBeGreaterThanOrEqual(1.3);
    expect(median(head) / median(base)).toBeCloseTo(1.3, 10);
  });
});

describe('benchmark regression decision', () => {
  it('passes identical base and candidate runs', () => {
    const runs = side('base', CATALOGUE, 10, 0.03, 1);
    const comparison = compareRuns(runs, runs);
    expect(comparison.failed).toBe(false);
    expect(comparison.tasks.map((t) => t.verdict)).toEqual(
      Object.keys(CATALOGUE).map(() => 'unchanged'),
    );
  });

  it('passes noisy runs of the same code across many seeds', () => {
    // 5% process-to-process noise on both sides, as on a shared CI runner.
    const verdicts = Array.from({ length: 60 }, (_, seed) =>
      compareRuns(
        side('base', CATALOGUE, 10, 0.05, 1000 + seed),
        side('head', CATALOGUE, 10, 0.05, 2000 + seed),
      ),
    );
    expect(verdicts.filter((c) => c.failed)).toHaveLength(0);
  });

  it('fails a clear 30% regression and names the task', () => {
    const slower = { ...CATALOGUE, 'headers/parse': 1_700 * 1.3 };
    const comparison = compareRuns(
      side('base', CATALOGUE, 10, 0.05, 11),
      side('head', slower, 10, 0.05, 12),
    );
    expect(comparison.failed).toBe(true);
    const task = comparison.tasks.find((t) => t.name === 'headers/parse')!;
    expect(task.verdict).toBe('regression');
    expect(task.ratio).toBeGreaterThan(1.2);
    expect(task.pSlowerAdjusted).toBeLessThan(0.05);
    expect(
      comparison.tasks
        .filter((t) => t.name !== 'headers/parse')
        .map((t) => t.verdict),
    ).toEqual(['unchanged', 'unchanged', 'unchanged']);
    expect(comparison.reasons.join('\n')).toContain('headers/parse');
    // A regression is not a fail-closed condition, so a trailer may excuse it.
    expect(comparison.closed).toEqual([]);
  });

  it('reports a clear 30% improvement without failing', () => {
    const faster = { ...CATALOGUE, 'schema/large-array': 450_000 * 0.7 };
    const comparison = compareRuns(
      side('base', CATALOGUE, 10, 0.05, 21),
      side('head', faster, 10, 0.05, 22),
    );
    expect(comparison.failed).toBe(false);
    expect(
      comparison.tasks.find((t) => t.name === 'schema/large-array')!.verdict,
    ).toBe('improvement');
    expect(renderMarkdown(comparison)).toContain('Improvements:');
  });

  it('does not fail a significant shift smaller than the minimum effect', () => {
    // 5% slower with almost no noise: significant, but below 10%.
    const slightly = { ...CATALOGUE, 'pipeline/GET small': 22_000 * 1.05 };
    const comparison = compareRuns(
      side('base', CATALOGUE, 10, 0.002, 31),
      side('head', slightly, 10, 0.002, 32),
    );
    const task = comparison.tasks.find((t) => t.name === 'pipeline/GET small')!;
    expect(task.pSlowerAdjusted).toBeLessThan(0.05);
    expect(task.verdict).toBe('unchanged');
    expect(comparison.failed).toBe(false);
  });

  it('does not fail a doubling below the absolute floor', () => {
    const comparison = compareRuns(
      side('base', { 'cache/miss': 0.8 }, 10, 0.01, 41),
      side('head', { 'cache/miss': 1.6 }, 10, 0.01, 42),
    );
    expect(comparison.tasks[0]!.verdict).toBe('unchanged');
    expect(comparison.failed).toBe(false);
  });

  it('fails closed when the baseline is missing', () => {
    const comparison = compareRuns([], side('head', CATALOGUE, 10, 0.05, 51));
    expect(comparison.failed).toBe(true);
    expect(comparison.reasons[0]).toMatch(/No baseline results/);
    expect(comparison.closed).toEqual(comparison.reasons);
    expect(renderMarkdown(comparison)).toContain('**Failed.**');
  });

  it('fails closed when no task was measured on both sides', () => {
    const comparison = compareRuns(
      side('base', { 'cache/old': 80 }, 10, 0.05, 55),
      side('head', { 'cache/new': 80 }, 10, 0.05, 56),
    );
    expect(comparison.failed).toBe(true);
    expect(comparison.closed).toContain('No task was measured on both sides.');
  });

  it('fails closed on too few rounds', () => {
    const comparison = compareRuns(
      side('base', CATALOGUE, 3, 0.05, 61),
      side('head', CATALOGUE, 10, 0.05, 62),
    );
    expect(comparison.failed).toBe(true);
    expect(comparison.closed).toHaveLength(Object.keys(CATALOGUE).length);
    expect(comparison.tasks.every((t) => t.verdict === 'insufficient')).toBe(
      true,
    );
  });

  it('fails a task the baseline measured and the candidate dropped', () => {
    const { 'cache/get hit': _dropped, ...rest } = CATALOGUE;
    const comparison = compareRuns(
      side('base', CATALOGUE, 10, 0.05, 71),
      side('head', rest, 10, 0.05, 72),
    );
    expect(comparison.failed).toBe(true);
    expect(
      comparison.tasks.find((t) => t.name === 'cache/get hit')!.verdict,
    ).toBe('removed');
  });

  it('reports a task only the candidate measures as new without failing', () => {
    const comparison = compareRuns(
      side('base', CATALOGUE, 10, 0.05, 81),
      side('head', { ...CATALOGUE, 'cache/new': 50 }, 10, 0.05, 82),
    );
    expect(comparison.failed).toBe(false);
    expect(comparison.tasks.find((t) => t.name === 'cache/new')!.verdict).toBe(
      'new',
    );
  });
});
