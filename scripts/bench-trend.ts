/**
 * npm run bench:trend -- --dir reports/bench --sha <commit>
 *                        [--reference <commit>] [--out <file>]
 *
 * Condenses one nightly benchmark run into a single JSON record for the
 * `bench-data` branch history: the candidate's per-task medians across
 * processes (p50, mean, p75, p99, RME) and, when a comparison was made, its
 * verdict. With no comparison.json in --dir the record is a bootstrap: it
 * measured, but had no reference to compare with.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import * as path from 'path';
import type { HarnessResult } from '../tests/benchmark/summary';
import { Comparison, median } from './bench-compare-core';

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

function main(): void {
  const dir = arg('dir') ?? path.join('reports', 'bench');
  const sha = arg('sha');
  if (!sha) throw new Error('--sha is required');

  const runs = readdirSync(dir)
    .filter((file) => /^head-\d+\.json$/.test(file))
    .map(
      (file) =>
        JSON.parse(readFileSync(path.join(dir, file), 'utf8')) as HarnessResult,
    );
  if (runs.length === 0) throw new Error(`No head-*.json results in ${dir}`);

  const tasks: Record<string, Record<string, number>> = {};
  for (const name of Object.keys(runs[0]!.tasks)) {
    const pick = (key: 'p50' | 'mean' | 'p75' | 'p99' | 'rme') =>
      median(runs.map((r) => r.tasks[name]?.[key] ?? Number.NaN));
    tasks[name] = {
      p50: pick('p50'),
      mean: pick('mean'),
      p75: pick('p75'),
      p99: pick('p99'),
      rme: pick('rme'),
    };
  }

  const comparisonFile = path.join(dir, 'comparison.json');
  const comparison = existsSync(comparisonFile)
    ? (JSON.parse(readFileSync(comparisonFile, 'utf8')) as Comparison)
    : null;
  const names = (verdict: string) =>
    comparison?.tasks.filter((t) => t.verdict === verdict).map((t) => t.name) ??
    [];

  const record = {
    date: new Date().toISOString(),
    sha,
    reference: arg('reference') || null,
    node: runs[0]!.node,
    platform: runs[0]!.platform,
    rounds: runs.length,
    verdict: comparison ? (comparison.failed ? 'fail' : 'pass') : 'bootstrap',
    regressions: names('regression'),
    improvements: names('improvement'),
    tasks,
  };

  const json = JSON.stringify(record);
  if (arg('out')) writeFileSync(arg('out')!, `${json}\n`);
  else console.log(json);
}

main();
