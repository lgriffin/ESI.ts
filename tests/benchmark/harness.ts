/**
 * Benchmark process entry point. One invocation runs every task once, in
 * catalogue order, and writes one JSON result file. `scripts/bench-ab.ts`
 * bundles this file per tree and runs it many times, interleaving base and
 * candidate processes; `scripts/bench-compare.ts` decides.
 *
 *   node --expose-gc harness.cjs --out result.json [--min-cpu-ms 200]
 *                                [--filter <regex>] [--label head]
 *
 * mitata decides per task whether to batch (operations under ~65 µs are
 * timed 1024 at a time and divided, so a 50 ns operation is not lost in
 * timer resolution), warms up, collects at least 30 samples and keeps
 * sampling until the CPU-time budget is spent. A full GC runs before each
 * task.
 */
import { writeFileSync } from 'fs';
import { do_not_optimize, measure } from 'mitata';
import { tasks } from './tasks';
import { HarnessResult, summarise } from './summary';

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main(): Promise<void> {
  const out = arg('out');
  if (!out) throw new Error('--out <file> is required');
  const gc = (globalThis as { gc?: () => void }).gc;
  if (!gc) {
    // Without it mitata falls back to allocating a 1 GiB buffer to provoke a
    // collection, which distorts every sample that follows.
    throw new Error('run node with --expose-gc');
  }
  const minCpuMs = Number(arg('min-cpu-ms') ?? 200);
  const filter = arg('filter') ? new RegExp(arg('filter')!) : undefined;

  const result: HarnessResult = {
    label: arg('label') ?? 'run',
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    minCpuMs,
    tasks: {},
  };

  for (const task of tasks) {
    if (filter && !filter.test(task.name)) continue;
    const { fn, teardown } = await task.setup();
    try {
      // Hand every result to do_not_optimize so the JIT cannot discard work
      // whose value is unused; await promises so async paths are timed whole.
      const probe = fn();
      if (probe instanceof Promise) await probe;
      const timed =
        probe instanceof Promise
          ? async () => do_not_optimize(await fn())
          : () => do_not_optimize(fn());
      const stats = await measure(timed, {
        gc,
        min_cpu_time: minCpuMs * 1e6,
        min_samples: 30,
        batch_samples: 1024,
      });
      result.tasks[task.name] = summarise(stats.samples);
    } finally {
      teardown?.();
    }
    process.stderr.write('.');
  }
  process.stderr.write('\n');

  writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
