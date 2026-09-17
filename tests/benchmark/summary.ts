/**
 * Per-process summary of one task's samples. Each sample is nanoseconds per
 * operation (mitata batches fast operations and divides), so the numbers are
 * comparable across tasks of very different speeds.
 */
export interface TaskSummary {
  /** Mean ns/op over the samples. */
  mean: number;
  /** Median ns/op: the value the comparison uses as this process's observation. */
  p50: number;
  p75: number;
  p99: number;
  /** Relative margin of error of the mean at 95% confidence, in percent. */
  rme: number;
  /** Samples taken (after mitata trims the extremes). */
  samples: number;
}

/** One harness process's output file. */
export interface HarnessResult {
  label: string;
  node: string;
  platform: string;
  minCpuMs: number;
  tasks: Record<string, TaskSummary>;
}

/** Two-sided 95% Student t critical values for 1..30 degrees of freedom. */
const T_95 = [
  12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201,
  2.179, 2.16, 2.145, 2.131, 2.12, 2.11, 2.101, 2.093, 2.086, 2.08, 2.074,
  2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042,
];

export function tCritical95(degreesOfFreedom: number): number {
  if (degreesOfFreedom < 1) return Number.NaN;
  return T_95[degreesOfFreedom - 1] ?? 1.96;
}

/** Nearest-rank percentile of an ascending array. */
export function percentile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return Number.NaN;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(q * sorted.length) - 1),
  );
  return sorted[index]!;
}

export function summarise(samples: readonly number[]): TaskSummary {
  const sorted = [...samples].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((sum, v) => sum + v, 0) / n;
  const variance =
    n > 1 ? sorted.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1) : 0;
  const sem = Math.sqrt(variance / n);
  return {
    mean,
    p50: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.75),
    p99: percentile(sorted, 0.99),
    rme: n > 1 && mean > 0 ? ((tCritical95(n - 1) * sem) / mean) * 100 : 0,
    samples: n,
  };
}
