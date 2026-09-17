/**
 * The decision behind `npm run bench:compare`: did the candidate get slower?
 *
 * Unit of observation. Each harness process reports, per task, the median
 * ns/op of its samples. Samples inside one process are autocorrelated and
 * share one JIT outcome, so treating them as independent would make a p-value
 * look far stronger than the evidence. The comparison therefore uses one
 * observation per process: base and candidate are each run in many separate,
 * interleaved processes on the same machine, and the per-process medians are
 * the two samples compared.
 *
 * Test. A one-sided Mann–Whitney U test per task (exact for small untied
 * samples, normal approximation with tie correction otherwise) asks whether
 * candidate medians are stochastically larger than base medians. Holm's
 * step-down procedure adjusts the p-values across tasks so the family-wise
 * false-alarm rate stays at `alpha` however many tasks the catalogue holds.
 *
 * Effect size. Significance alone is not a regression: with enough rounds a
 * 1% change from code layout is significant and nobody should be blocked by
 * it. A task regresses only when the adjusted p-value is below `alpha`, the
 * ratio of medians is at least `1 + minEffect`, and the absolute difference is
 * at least `minAbsoluteNs` (a sub-nanosecond task can double on noise). A
 * seeded bootstrap interval for the ratio of medians is reported alongside.
 *
 * Fails closed. No baseline runs, too few rounds on either side, a task the
 * baseline measured that the candidate did not, or no comparable task at all
 * each fail the comparison. A task only the candidate measures is reported as
 * `new` and does not fail: it has nothing to regress against until it lands.
 */
import type { HarnessResult, TaskSummary } from '../tests/benchmark/summary';

export interface CompareOptions {
  /** Family-wise significance level across tasks (Holm). */
  alpha: number;
  /** Smallest relative slowdown that counts, e.g. 0.1 for 10%. */
  minEffect: number;
  /** Smallest absolute ns/op difference that counts. */
  minAbsoluteNs: number;
  /** Fewer processes than this on either side fails closed. */
  minRounds: number;
  bootstrapResamples: number;
  seed: number;
}

export const DEFAULT_OPTIONS: CompareOptions = {
  alpha: 0.05,
  minEffect: 0.1,
  minAbsoluteNs: 2,
  minRounds: 5,
  bootstrapResamples: 2000,
  seed: 0x5eed,
};

export type Verdict =
  | 'regression'
  | 'improvement'
  | 'unchanged'
  | 'new'
  | 'removed'
  | 'insufficient';

/** Across-process medians of one side's per-process summaries. */
export interface SideStats {
  rounds: number;
  p50: number;
  mean: number;
  p75: number;
  p99: number;
  rme: number;
}

export interface TaskComparison {
  name: string;
  verdict: Verdict;
  base?: SideStats;
  head?: SideStats;
  /** median(head p50) / median(base p50). */
  ratio?: number;
  /** 95% bootstrap interval for `ratio`. */
  ci?: [number, number];
  pSlower?: number;
  pFaster?: number;
  pSlowerAdjusted?: number;
  pFasterAdjusted?: number;
}

export interface Comparison {
  tasks: TaskComparison[];
  failed: boolean;
  /** Every problem, regressions and fail-closed conditions alike. */
  reasons: string[];
  /**
   * The problems that are not regressions: the comparison could not be made
   * soundly. A reviewed `Performance-Accepted:` trailer never excuses these.
   */
  closed: string[];
  options: CompareOptions;
}

// ── Descriptive statistics ─────────────────────────────────────────────

export function median(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Standard normal CDF (Abramowitz and Stegun 7.1.26, error below 1.5e-7). */
export function normalCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

// ── Mann–Whitney U ─────────────────────────────────────────────────────

export interface MannWhitneyResult {
  /** Pairs (a, b) with b > a, ties counting one half. */
  u: number;
  /** P(U >= u) under H0: evidence that `b` is stochastically larger. */
  pGreater: number;
  /** P(U <= u) under H0: evidence that `b` is stochastically smaller. */
  pLess: number;
  exact: boolean;
}

const EXACT_LIMIT = 50;

/**
 * Number of arrangements of m and n observations giving each U, as a
 * distribution over 0..m*n. `f(m, n)[u] = f(m-1, n)[u-n] + f(m, n-1)[u]`.
 */
function exactUCounts(m: number, n: number): number[] {
  // counts[j] holds f(i, j) for the current i.
  let previous: number[][] = Array.from({ length: n + 1 }, () => [1]);
  for (let i = 1; i <= m; i++) {
    const current: number[][] = [[1]];
    for (let j = 1; j <= n; j++) {
      const size = i * j + 1;
      const row = new Array<number>(size).fill(0);
      const left = previous[j]!; // f(i-1, j)
      const down = current[j - 1]!; // f(i, j-1)
      for (let u = 0; u < size; u++) {
        row[u] = (u - j >= 0 ? (left[u - j] ?? 0) : 0) + (down[u] ?? 0);
      }
      current.push(row);
    }
    previous = current;
  }
  return previous[n]!;
}

export function mannWhitney(
  a: readonly number[],
  b: readonly number[],
): MannWhitneyResult {
  const m = a.length;
  const n = b.length;
  if (m === 0 || n === 0) {
    return { u: Number.NaN, pGreater: 1, pLess: 1, exact: false };
  }
  let u = 0;
  let ties = false;
  for (const x of a) {
    for (const y of b) {
      if (y > x) u += 1;
      else if (y === x) {
        u += 0.5;
        ties = true;
      }
    }
  }

  if (!ties && m + n <= EXACT_LIMIT) {
    const counts = exactUCounts(m, n);
    const total = counts.reduce((sum, c) => sum + c, 0);
    let atLeast = 0;
    let atMost = 0;
    counts.forEach((count, value) => {
      if (value >= u) atLeast += count;
      if (value <= u) atMost += count;
    });
    return { u, pGreater: atLeast / total, pLess: atMost / total, exact: true };
  }

  // Normal approximation with tie correction and continuity correction.
  const all = [...a, ...b].sort((x, y) => x - y);
  const size = m + n;
  let tieTerm = 0;
  for (let i = 0; i < size;) {
    let j = i;
    while (j + 1 < size && all[j + 1] === all[i]) j++;
    const t = j - i + 1;
    tieTerm += t ** 3 - t;
    i = j + 1;
  }
  const mean = (m * n) / 2;
  const variance = ((m * n) / 12) * (size + 1 - tieTerm / (size * (size - 1)));
  if (variance <= 0) return { u, pGreater: 1, pLess: 1, exact: false };
  const sd = Math.sqrt(variance);
  return {
    u,
    pGreater: 1 - normalCdf((u - mean - 0.5) / sd),
    pLess: normalCdf((u - mean + 0.5) / sd),
    exact: false,
  };
}

/** Holm–Bonferroni adjusted p-values, returned in input order. */
export function holm(pValues: readonly number[]): number[] {
  const k = pValues.length;
  const order = pValues
    .map((p, index) => ({ p, index }))
    .sort((x, y) => x.p - y.p);
  const adjusted = new Array<number>(k);
  let running = 0;
  order.forEach(({ p, index }, rank) => {
    running = Math.max(running, Math.min(1, (k - rank) * p));
    adjusted[index] = running;
  });
  return adjusted;
}

// ── Bootstrap ──────────────────────────────────────────────────────────

/** mulberry32: a small seeded PRNG, so a report is reproducible. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function bootstrapRatioCi(
  base: readonly number[],
  head: readonly number[],
  resamples: number,
  seed: number,
): [number, number] {
  const random = seededRandom(seed);
  const draw = (values: readonly number[]) =>
    median(
      Array.from(
        { length: values.length },
        () => values[Math.floor(random() * values.length)]!,
      ),
    );
  const ratios = Array.from(
    { length: resamples },
    () => draw(head) / draw(base),
  ).sort((x, y) => x - y);
  return [
    ratios[Math.floor(0.025 * (resamples - 1))]!,
    ratios[Math.ceil(0.975 * (resamples - 1))]!,
  ];
}

// ── Comparison ─────────────────────────────────────────────────────────

function observations(runs: readonly HarnessResult[]) {
  const byTask = new Map<string, TaskSummary[]>();
  for (const run of runs) {
    for (const [name, summary] of Object.entries(run.tasks)) {
      const list = byTask.get(name) ?? [];
      list.push(summary);
      byTask.set(name, list);
    }
  }
  return byTask;
}

function sideStats(summaries: readonly TaskSummary[]): SideStats {
  const pick = (key: keyof TaskSummary) => median(summaries.map((s) => s[key]));
  return {
    rounds: summaries.length,
    p50: pick('p50'),
    mean: pick('mean'),
    p75: pick('p75'),
    p99: pick('p99'),
    rme: pick('rme'),
  };
}

export function compareRuns(
  baseRuns: readonly HarnessResult[],
  headRuns: readonly HarnessResult[],
  overrides: Partial<CompareOptions> = {},
): Comparison {
  const options = { ...DEFAULT_OPTIONS, ...overrides };
  const reasons: string[] = [];
  if (baseRuns.length === 0) {
    reasons.push(
      'No baseline results: nothing to compare against, so the comparison fails closed.',
    );
  }
  if (headRuns.length === 0) {
    reasons.push('No candidate results: the benchmark did not run.');
  }
  if (reasons.length > 0) {
    return { tasks: [], failed: true, reasons, closed: [...reasons], options };
  }

  const base = observations(baseRuns);
  const head = observations(headRuns);
  const names = [...new Set([...base.keys(), ...head.keys()])].sort();

  const tasks: TaskComparison[] = [];
  const tested: TaskComparison[] = [];
  const pairs = new Map<TaskComparison, [number[], number[]]>();

  for (const name of names) {
    const b = base.get(name);
    const h = head.get(name);
    if (!b) {
      tasks.push({ name, verdict: 'new', head: sideStats(h!) });
      continue;
    }
    if (!h) {
      tasks.push({ name, verdict: 'removed', base: sideStats(b) });
      reasons.push(
        `${name}: the baseline measured this task and the candidate did not.`,
      );
      continue;
    }
    const entry: TaskComparison = {
      name,
      verdict: 'unchanged',
      base: sideStats(b),
      head: sideStats(h),
    };
    tasks.push(entry);
    if (b.length < options.minRounds || h.length < options.minRounds) {
      entry.verdict = 'insufficient';
      reasons.push(
        `${name}: ${b.length} baseline and ${h.length} candidate rounds, fewer than the ${options.minRounds} required.`,
      );
      continue;
    }
    const baseP50 = b.map((s) => s.p50);
    const headP50 = h.map((s) => s.p50);
    const test = mannWhitney(baseP50, headP50);
    entry.ratio = median(headP50) / median(baseP50);
    entry.ci = bootstrapRatioCi(
      baseP50,
      headP50,
      options.bootstrapResamples,
      options.seed,
    );
    entry.pSlower = test.pGreater;
    entry.pFaster = test.pLess;
    tested.push(entry);
    pairs.set(entry, [baseP50, headP50]);
  }

  const slower = holm(tested.map((t) => t.pSlower!));
  const faster = holm(tested.map((t) => t.pFaster!));
  tested.forEach((entry, i) => {
    entry.pSlowerAdjusted = slower[i]!;
    entry.pFasterAdjusted = faster[i]!;
    const [b, h] = pairs.get(entry)!;
    const delta = median(h) - median(b);
    const ratio = entry.ratio!;
    if (
      entry.pSlowerAdjusted < options.alpha &&
      ratio >= 1 + options.minEffect &&
      delta >= options.minAbsoluteNs
    ) {
      entry.verdict = 'regression';
    } else if (
      entry.pFasterAdjusted < options.alpha &&
      ratio <= 1 / (1 + options.minEffect) &&
      -delta >= options.minAbsoluteNs
    ) {
      entry.verdict = 'improvement';
    }
  });

  if (tested.length === 0 && !tasks.some((t) => t.verdict === 'insufficient')) {
    reasons.push('No task was measured on both sides.');
  }
  const closed = [...reasons];
  for (const entry of tested) {
    if (entry.verdict === 'regression') {
      reasons.push(
        `${entry.name}: ${formatRatio(entry.ratio!)} slower (adjusted p=${entry.pSlowerAdjusted!.toPrecision(2)}).`,
      );
    }
  }

  return { tasks, failed: reasons.length > 0, reasons, closed, options };
}

// ── Reporting ──────────────────────────────────────────────────────────

export function formatNs(ns: number): string {
  if (!Number.isFinite(ns)) return '—';
  if (ns >= 1e9) return `${(ns / 1e9).toFixed(2)} s`;
  if (ns >= 1e6) return `${(ns / 1e6).toFixed(2)} ms`;
  if (ns >= 1e3) return `${(ns / 1e3).toFixed(2)} µs`;
  return `${ns.toFixed(ns >= 100 ? 0 : 1)} ns`;
}

function formatRatio(ratio: number): string {
  const percent = (ratio - 1) * 100;
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`;
}

const VERDICT_LABEL: Record<Verdict, string> = {
  regression: '**regression**',
  improvement: 'improvement',
  unchanged: 'unchanged',
  new: 'new (no baseline)',
  removed: '**removed**',
  insufficient: '**too few rounds**',
};

export function renderMarkdown(
  comparison: Comparison,
  title = 'Benchmark comparison',
): string {
  const { options } = comparison;
  const lines = [
    `## ${title}`,
    '',
    comparison.failed
      ? `**Failed.** ${comparison.reasons.length} problem(s):`
      : 'No statistically significant regression.',
    ...comparison.reasons.map((r) => `- ${r}`),
    '',
    `Per-process median ns/op compared with a one-sided Mann–Whitney U test, Holm-adjusted across tasks at α=${options.alpha}. ` +
      `A regression also needs a slowdown of at least ${(options.minEffect * 100).toFixed(0)}% and ${options.minAbsoluteNs} ns/op. ` +
      `Base and candidate values are medians across processes; RME is the within-process margin of error of the mean.`,
    '',
    '| Task | Base p50 | Head p50 | Head mean | Head p75 | Head p99 | Head RME | Change | 95% CI | p (adj) | Verdict |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | --- |',
  ];
  for (const t of comparison.tasks) {
    const p =
      t.ratio === undefined
        ? '—'
        : (t.ratio >= 1 ? t.pSlowerAdjusted! : t.pFasterAdjusted!).toPrecision(
            2,
          );
    lines.push(
      [
        '',
        t.name,
        t.base ? formatNs(t.base.p50) : '—',
        t.head ? formatNs(t.head.p50) : '—',
        t.head ? formatNs(t.head.mean) : '—',
        t.head ? formatNs(t.head.p75) : '—',
        t.head ? formatNs(t.head.p99) : '—',
        t.head ? `±${t.head.rme.toFixed(1)}%` : '—',
        t.ratio === undefined ? '—' : formatRatio(t.ratio),
        t.ci ? `${formatRatio(t.ci[0])} … ${formatRatio(t.ci[1])}` : '—',
        p,
        VERDICT_LABEL[t.verdict],
        '',
      ]
        .join(' | ')
        .trim(),
    );
  }
  const improvements = comparison.tasks.filter(
    (t) => t.verdict === 'improvement',
  );
  if (improvements.length > 0) {
    lines.push(
      '',
      `Improvements: ${improvements.map((t) => `${t.name} (${formatRatio(t.ratio!)})`).join(', ')}.`,
    );
  }
  return `${lines.join('\n')}\n`;
}
