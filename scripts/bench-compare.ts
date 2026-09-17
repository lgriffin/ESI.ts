/**
 * npm run bench:compare -- [--dir reports/bench] [--title <text>]
 *                          [--min-effect 0.1] [--alpha 0.05]
 *
 * Reads the base-*.json and head-*.json files `npm run bench:ab` wrote,
 * prints the comparison as a Markdown table (also to $GITHUB_STEP_SUMMARY
 * when set), writes <dir>/comparison.json and comparison.md, and exits:
 *   0  no statistically significant regression;
 *   3  one or more regressions, and nothing else wrong;
 *   1  the comparison could not be made soundly (fails closed).
 * CI lets a reviewed `Performance-Accepted:` commit trailer excuse exit 3,
 * never exit 1. See scripts/bench-compare-core.ts for the method.
 */
import {
  appendFileSync,
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'fs';
import * as path from 'path';
import type { HarnessResult } from '../tests/benchmark/summary';
import {
  CompareOptions,
  compareRuns,
  renderMarkdown,
} from './bench-compare-core';

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

function load(dir: string, label: string): HarnessResult[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.startsWith(`${label}-`) && file.endsWith('.json'))
    .sort()
    .map(
      (file) =>
        JSON.parse(readFileSync(path.join(dir, file), 'utf8')) as HarnessResult,
    );
}

function main(): void {
  const dir = arg('dir') ?? path.join('reports', 'bench');
  const overrides: Partial<CompareOptions> = {};
  if (arg('min-effect')) overrides.minEffect = Number(arg('min-effect'));
  if (arg('alpha')) overrides.alpha = Number(arg('alpha'));

  const comparison = compareRuns(
    load(dir, 'base'),
    load(dir, 'head'),
    overrides,
  );
  const markdown = renderMarkdown(
    comparison,
    arg('title') ?? 'Benchmark comparison',
  );

  console.log(markdown);
  if (existsSync(dir)) {
    writeFileSync(path.join(dir, 'comparison.md'), markdown);
    writeFileSync(
      path.join(dir, 'comparison.json'),
      `${JSON.stringify(comparison, null, 2)}\n`,
    );
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
  }
  if (comparison.closed.length > 0) process.exit(1);
  if (comparison.failed) process.exit(3);
}

main();
