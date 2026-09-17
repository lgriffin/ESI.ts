/**
 * The verdict on a heap soak (tests/benchmark/soak.ts).
 *
 * Heap. `heapUsed` after forced full collections is what the process still
 * references. The first half of the run is warm-up: JIT code, the cache
 * filling to its bound, V8's pools reaching steady size. Over the second half
 * a least-squares line is fitted to heapUsed against requests sent. The run
 * leaks when that slope projects growth above both a rate threshold (bytes
 * per 1000 requests) and an absolute floor, so neither slow noise over a long
 * run nor a large one-off step fails it on its own.
 *
 * Cache bound. Every sample's entry count must sit at or below the
 * configured `maxEntries`.
 *
 * Handles. Active timers must not drift across samples (a timer per request
 * left uncleared grows without bound) and must return to the count before
 * the client existed once it is shut down; process listeners likewise.
 */
import type { SoakRun } from '../tests/benchmark/soak';

export interface SoakThresholds {
  /** Growth above this rate over the second half is a leak. */
  maxBytesPerThousandRequests: number;
  /** ...provided the projected growth also exceeds this. */
  minGrowthBytes: number;
  /** Allowed spread of the active timer count across samples. */
  maxTimerDrift: number;
}

export const DEFAULT_THRESHOLDS: SoakThresholds = {
  maxBytesPerThousandRequests: 20_000,
  minGrowthBytes: 2 * 1024 * 1024,
  maxTimerDrift: 2,
};

export interface LinearFit {
  slope: number;
  intercept: number;
  r2: number;
}

export function linearFit(
  xs: readonly number[],
  ys: readonly number[],
): LinearFit {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: ys[0] ?? 0, r2: 0 };
  const meanX = xs.reduce((s, x) => s + x, 0) / n;
  const meanY = ys.reduce((s, y) => s + y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i]! - meanX;
    const dy = ys[i]! - meanY;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  return {
    slope,
    intercept: meanY - slope * meanX,
    r2: sxx === 0 || syy === 0 ? 0 : (sxy * sxy) / (sxx * syy),
  };
}

export interface SoakVerdict {
  passed: boolean;
  findings: string[];
  /** Fitted heap growth over the second half, bytes per 1000 requests. */
  bytesPerThousandRequests: number;
  /** Fitted growth across the second half, bytes. */
  projectedGrowthBytes: number;
  r2: number;
  heapFirst: number;
  heapLast: number;
  maxCacheEntries: number;
}

export function analyseSoak(
  run: SoakRun,
  thresholds: SoakThresholds = DEFAULT_THRESHOLDS,
): SoakVerdict {
  const findings: string[] = [];
  const { samples } = run;
  if (samples.length < 6) {
    findings.push(
      `Only ${samples.length} samples; the heap trend needs at least 6.`,
    );
  }

  const secondHalf = samples.slice(Math.floor(samples.length / 2));
  const fit = linearFit(
    secondHalf.map((s) => s.requests),
    secondHalf.map((s) => s.heapUsed),
  );
  const span =
    secondHalf.length > 1
      ? secondHalf[secondHalf.length - 1]!.requests - secondHalf[0]!.requests
      : 0;
  const projectedGrowthBytes = fit.slope * span;
  const bytesPerThousandRequests = fit.slope * 1000;
  if (
    bytesPerThousandRequests > thresholds.maxBytesPerThousandRequests &&
    projectedGrowthBytes > thresholds.minGrowthBytes
  ) {
    findings.push(
      `Heap grew ${formatBytes(projectedGrowthBytes)} over the second half (${formatBytes(bytesPerThousandRequests)} per 1000 requests, R²=${fit.r2.toFixed(2)}); the limit is ${formatBytes(thresholds.maxBytesPerThousandRequests)} per 1000 requests.`,
    );
  }

  const maxCacheEntries = Math.max(0, ...samples.map((s) => s.cacheEntries));
  if (maxCacheEntries > run.options.cacheMaxEntries) {
    findings.push(
      `The cache held ${maxCacheEntries} entries, above its bound of ${run.options.cacheMaxEntries}.`,
    );
  }

  const timers = samples.map((s) => s.timers);
  if (
    timers.length > 0 &&
    Math.max(...timers) - Math.min(...timers) > thresholds.maxTimerDrift
  ) {
    findings.push(
      `Active timers drifted from ${Math.min(...timers)} to ${Math.max(...timers)} across samples.`,
    );
  }
  if (run.timersAfterShutdown > run.timersBefore) {
    findings.push(
      `${run.timersAfterShutdown - run.timersBefore} timer(s) still active after shutdown.`,
    );
  }
  if (run.listenersAfterShutdown > run.listenersBefore) {
    findings.push(
      `${run.listenersAfterShutdown - run.listenersBefore} process listener(s) left after shutdown.`,
    );
  }
  if (run.unexpectedErrors.length > 0) {
    findings.push(
      `Requests failed unexpectedly: ${run.unexpectedErrors.slice(0, 3).join('; ')}`,
    );
  }

  return {
    passed: findings.length === 0,
    findings,
    bytesPerThousandRequests,
    projectedGrowthBytes,
    r2: fit.r2,
    heapFirst: samples[0]?.heapUsed ?? 0,
    heapLast: samples[samples.length - 1]?.heapUsed ?? 0,
    maxCacheEntries,
  };
}

export function formatBytes(bytes: number): string {
  const sign = bytes < 0 ? '-' : '';
  const value = Math.abs(bytes);
  if (value >= 1024 * 1024)
    return `${sign}${(value / 1024 / 1024).toFixed(2)} MiB`;
  if (value >= 1024) return `${sign}${(value / 1024).toFixed(1)} KiB`;
  return `${sign}${value.toFixed(0)} B`;
}

export function renderSoakMarkdown(run: SoakRun, verdict: SoakVerdict): string {
  return [
    '## Heap soak',
    '',
    verdict.passed
      ? 'No leak detected.'
      : `**Failed.** ${verdict.findings.length} finding(s):`,
    ...verdict.findings.map((f) => `- ${f}`),
    '',
    '| Measure | Value |',
    '| --- | ---: |',
    `| Requests | ${run.options.requests} (${run.options.distinctKeys} distinct keys, concurrency ${run.options.concurrency}) |`,
    `| Duration | ${(run.durationMs / 1000).toFixed(1)} s |`,
    `| Heap after GC, first / last sample | ${formatBytes(verdict.heapFirst)} / ${formatBytes(verdict.heapLast)} |`,
    `| Second-half trend | ${formatBytes(verdict.bytesPerThousandRequests)} per 1000 requests (R²=${verdict.r2.toFixed(2)}) |`,
    `| Cache entries, max / bound | ${verdict.maxCacheEntries} / ${run.options.cacheMaxEntries} |`,
    `| Timers before / after shutdown | ${run.timersBefore} / ${run.timersAfterShutdown} |`,
    `| Process listeners before / after shutdown | ${run.listenersBefore} / ${run.listenersAfterShutdown} |`,
    '',
  ].join('\n');
}
