/**
 * npm run bench:ab -- --base <tree> --head <tree> [--out reports/bench]
 *                     [--rounds 10] [--min-cpu-ms 200] [--filter <regex>]
 * npm run benchmark [-- --rounds 3 --filter cache]
 *
 * `npm run benchmark` measures the working tree alone and prints a table of
 * medians across processes; it compares nothing.
 *
 * Runs the micro-benchmarks for two source trees on this machine, in one job,
 * so runner-to-runner noise cancels. Both trees are measured with the
 * candidate's harness (tests/benchmark from --head, copied into --base), so
 * any difference comes from src/ and dependencies, not from the harness.
 *
 * Each round runs one base process and one head process, alternating which
 * goes first (ABBA), so slow drift over the job (thermal, a noisy neighbour)
 * lands on both sides equally. Every process writes
 * <out>/<base|head>-<round>.json; `npm run bench:compare` decides.
 *
 * If the candidate harness does not build against the base tree (the pull
 * request changed an internal API the harness imports), the base tree is
 * measured with its own harness instead and the tasks are matched by name.
 * If neither builds, the run fails: there is no baseline, and a missing
 * baseline never passes.
 *
 * --base and --head may be the same tree, which measures run-to-run noise.
 * The base tree is modified (its tests/benchmark is replaced), so pass a
 * disposable checkout such as a `git worktree`.
 */
import { spawnSync } from 'child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import * as path from 'path';
import { buildSync } from 'esbuild';
import type { HarnessResult } from '../tests/benchmark/summary';
import { formatNs, median } from './bench-compare-core';

const HARNESS_DIR = path.join('tests', 'benchmark');
const HARNESS_ENTRY = path.join(HARNESS_DIR, 'harness.ts');
const BUNDLE = path.join('.bench-out', 'harness.cjs');

/** Packages the harness bundle loads at run time rather than inlining. */
// bun:jsc is mitata's Bun-only heap probe, imported lazily and never reached
// on Node.
const EXTERNAL = ['pino', 'better-sqlite3', 'adm-zip', 'js-yaml', 'bun:jsc'];

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

/**
 * Bundle a tree's harness with esbuild, the bundler tsup uses for the
 * published build. `nodePaths` lets the base tree borrow the benchmark
 * tooling (mitata) from the candidate's node_modules when its own lockfile
 * predates it; everything the tree has itself, zod included, resolves first.
 */
function bundle(tree: string, fallbackModules: string): string | null {
  const outfile = path.join(tree, BUNDLE);
  try {
    buildSync({
      entryPoints: [path.join(tree, HARNESS_ENTRY)],
      outfile,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      external: EXTERNAL,
      nodePaths: [fallbackModules],
      logLevel: 'error',
    });
    return outfile;
  } catch {
    return null;
  }
}

function prepareBase(base: string, head: string): 'candidate' | 'own' {
  const modules = path.join(head, 'node_modules');
  if (path.resolve(base) === path.resolve(head)) {
    if (!bundle(head, modules)) throw new Error('The harness does not build.');
    return 'candidate';
  }

  const ownHarness = path.join(base, '.bench-out', 'own-harness');
  const baseHarness = path.join(base, HARNESS_DIR);
  rmSync(ownHarness, { recursive: true, force: true });
  if (existsSync(baseHarness)) {
    mkdirSync(path.dirname(ownHarness), { recursive: true });
    cpSync(baseHarness, ownHarness, { recursive: true });
  }

  rmSync(baseHarness, { recursive: true, force: true });
  cpSync(path.join(head, HARNESS_DIR), baseHarness, { recursive: true });
  if (bundle(base, modules)) return 'candidate';

  console.warn(
    'The candidate harness does not build against the base tree; measuring the base with its own harness.',
  );
  rmSync(baseHarness, { recursive: true, force: true });
  if (existsSync(ownHarness)) {
    cpSync(ownHarness, baseHarness, { recursive: true });
    if (existsSync(path.join(base, HARNESS_ENTRY)) && bundle(base, modules)) {
      return 'own';
    }
  }
  throw new Error(
    'Neither the candidate harness nor the base tree’s own harness builds against the base tree, so there is no baseline to compare with.',
  );
}

function runProcess(
  tree: string,
  label: string,
  round: number,
  out: string,
  minCpuMs: string,
  filter: string | undefined,
  fallbackModules: string,
): void {
  const file = path.resolve(
    out,
    `${label}-${String(round).padStart(2, '0')}.json`,
  );
  const args = [
    '--expose-gc',
    path.join(tree, BUNDLE),
    '--out',
    file,
    '--label',
    label,
    '--min-cpu-ms',
    minCpuMs,
    ...(filter ? ['--filter', filter] : []),
  ];
  process.stderr.write(`round ${round} ${label} `);
  const result = spawnSync(process.execPath, args, {
    cwd: tree,
    stdio: ['ignore', 'inherit', 'inherit'],
    // The same fallback the bundle used, for the packages left external.
    env: { ...process.env, NODE_PATH: path.resolve(fallbackModules) },
  });
  if (result.status !== 0) {
    throw new Error(
      `${label} round ${round} exited with ${result.status ?? result.signal}`,
    );
  }
}

/** The table `npm run benchmark` prints when there is no base to compare. */
function printSummary(out: string, rounds: number): void {
  const runs = Array.from(
    { length: rounds },
    (_, i) =>
      JSON.parse(
        readFileSync(
          path.join(out, `head-${String(i + 1).padStart(2, '0')}.json`),
          'utf8',
        ),
      ) as HarnessResult,
  );
  const rows = Object.keys(runs[0]!.tasks).map((name) => {
    const pick = (key: 'p50' | 'mean' | 'p75' | 'p99' | 'rme') =>
      median(runs.map((r) => r.tasks[name]![key]));
    return [
      name,
      formatNs(pick('p50')),
      formatNs(pick('mean')),
      formatNs(pick('p75')),
      formatNs(pick('p99')),
      `±${pick('rme').toFixed(1)}%`,
    ];
  });
  console.log(
    [
      '| Task | p50 | mean | p75 | p99 | RME |',
      '| --- | ---: | ---: | ---: | ---: | ---: |',
      ...rows.map((row) => `| ${row.join(' | ')} |`),
    ].join('\n'),
  );
}

function main(): void {
  const base = arg('base');
  const head = arg('head');
  if (!head) {
    console.error(
      'Usage: bench-ab --head <tree> [--base <tree>] [--out dir] [--rounds n]',
    );
    process.exit(2);
  }
  const out = arg('out') ?? path.join('reports', 'bench');
  const rounds = Number(arg('rounds') ?? (base ? 10 : 3));
  const minCpuMs = arg('min-cpu-ms') ?? '200';
  const filter = arg('filter');

  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  const modules = path.join(head, 'node_modules');
  if (!bundle(head, modules)) {
    console.error('The candidate harness does not build.');
    process.exit(1);
  }
  const started = Date.now();
  if (!base) {
    for (let round = 1; round <= rounds; round++) {
      runProcess(head, 'head', round, out, minCpuMs, filter, modules);
    }
    printSummary(out, rounds);
    return;
  }
  const harness = prepareBase(base, head);

  for (let round = 1; round <= rounds; round++) {
    const order: Array<[string, string]> =
      round % 2 === 1
        ? [
            [base, 'base'],
            [head, 'head'],
          ]
        : [
            [head, 'head'],
            [base, 'base'],
          ];
    for (const [tree, label] of order) {
      runProcess(tree, label, round, out, minCpuMs, filter, modules);
    }
  }

  writeFileSync(
    path.join(out, 'meta.json'),
    `${JSON.stringify(
      {
        rounds,
        minCpuMs: Number(minCpuMs),
        baseHarness: harness,
        filter: filter ?? null,
        seconds: Math.round((Date.now() - started) / 1000),
      },
      null,
      2,
    )}\n`,
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
