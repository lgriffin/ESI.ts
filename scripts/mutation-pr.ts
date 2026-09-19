/**
 * npm run mutation:pr [-- <extra stryker args, e.g. --concurrency 4>]
 *
 * Pull request mutation testing (bead esi-23g.12). In order:
 *
 * 1. Resolves the base: MUTATION_BASE_REF (CI sets HEAD^1, the base tip of the
 *    pull request merge commit), else the merge base with origin/master or
 *    master. No base: fail closed.
 * 2. Ratchet direction: mutation-thresholds.json may add or raise floors but
 *    never lower or remove one relative to the base copy. Missing or
 *    unreadable head file: fail closed. The base predating the file is the
 *    only case with nothing to compare.
 * 3. Plans the run from `git diff <base>`: changed src/ files inside the unit
 *    config's `mutate` scope, plus every file in a directory whose floor the
 *    pull request adds or raises, because a raise is proven by fresh results
 *    and a file outside `--mutate` keeps its nightly ones. Neither: prints
 *    why, exits 0.
 * 4. Runs Stryker with --incremental and --mutate narrowed to those files, plus
 *    any file in the same directories that the restored nightly incremental
 *    report (reports/mutation/stryker-incremental.json) does not cover. With
 *    no restored report that is every file in those directories.
 * 5. Scores each touched directory (fresh results for changed code, nightly
 *    results for the rest) against mutation-thresholds.json and fails if one
 *    is below its floor or has none. Per-file scores and undetected mutants
 *    go to $GITHUB_STEP_SUMMARY.
 *
 * --baseline-shard (npm run mutation:pr:shard) runs step 3 alone, before any
 * baseline is restored, and names the one nightly shard in
 * mutation-unit-shards.json whose incremental report covers every file the
 * run may mutate (esi-23g.55). It prints the choice and writes `shard=<name>`
 * (empty for none) to $GITHUB_OUTPUT, for ci.yml to restore that shard's
 * cache. A change spanning shards gets none and runs cold.
 *
 * Exit codes: 0 pass or nothing to mutate, 1 ratchet failed, 2 the check
 * itself could not run.
 */
import { execFileSync, spawnSync } from 'child_process';
import { appendFileSync, existsSync, readFileSync } from 'fs';
import * as path from 'path';
import { baselineShardFor, parseShards } from './mutation-merge-core';
import {
  Git,
  MutationCheckError,
  MutationReport,
  gatePrRun,
  planPrRun,
  readThresholdPair,
  renderPrSummary,
  resolveBaseRef,
  scoreFiles,
  thresholdDecreases,
  thresholdRaises,
  undetectedMutants,
} from './mutation-ratchet-core';

const ROOT = path.resolve(__dirname, '..');
const THRESHOLDS = 'mutation-thresholds.json';
const CONFIG = 'stryker.config.mjs';
const INCREMENTAL = 'reports/mutation/stryker-incremental.json';
const REPORT = 'reports/mutation/mutation.json';
const SHARDS = 'mutation-unit-shards.json';

const EXIT_RATCHET = 1;
const EXIT_BROKEN = 2;

const Broken = MutationCheckError;

const git: Git = (args) =>
  execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

function summary(text: string): void {
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
  }
}

function mutatePatterns(): string[] {
  const url = `file:///${path.join(ROOT, CONFIG).replace(/\\/g, '/')}`;
  const out = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `const { default: c } = await import(${JSON.stringify(url)}); console.log(JSON.stringify(c.mutate));`,
    ],
    { cwd: ROOT, encoding: 'utf8' },
  );
  const patterns: unknown = JSON.parse(out);
  if (
    !Array.isArray(patterns) ||
    patterns.length === 0 ||
    !patterns.every((p) => typeof p === 'string')
  ) {
    throw new Broken(`${CONFIG} has no usable \`mutate\` list.`);
  }
  return patterns as string[];
}

function readBaseline(): {
  sources: Map<string, string> | null;
  note: string;
} {
  const file = path.join(ROOT, INCREMENTAL);
  if (!existsSync(file)) {
    return {
      sources: null,
      note: `no nightly incremental report at \`${INCREMENTAL}\`; every file in the touched directories is mutated from scratch.`,
    };
  }
  try {
    const report = JSON.parse(readFileSync(file, 'utf8')) as {
      files: Record<string, { source?: string }>;
    };
    const sources = new Map(
      Object.entries(report.files).map(([f, { source }]) => [f, source ?? '']),
    );
    return {
      sources,
      note: `nightly incremental report restored (${sources.size} files); unchanged mutants reuse its results.`,
    };
  } catch (err) {
    throw new Broken(
      `${INCREMENTAL} exists but is unreadable (${(err as Error).message}); delete it or restore a good copy.`,
    );
  }
}

function runStryker(mutate: string[], extra: string[]): void {
  const bin = path.join(
    ROOT,
    'node_modules/@stryker-mutator/core/bin/stryker.js',
  );
  const args = [
    bin,
    'run',
    CONFIG,
    '--incremental',
    '--mutate',
    mutate.join(','),
    ...extra,
  ];
  console.log(`\n> stryker ${args.slice(1).join(' ')}\n`);
  const result = spawnSync(process.execPath, args, {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Broken(
      `Stryker exited with ${result.status ?? result.signal}; no score to gate.`,
    );
  }
}

function changedAndTracked(base: string): {
  changedFiles: string[];
  trackedFiles: string[];
} {
  return {
    changedFiles: git([
      'diff',
      '--name-only',
      '--diff-filter=d',
      base,
      '--',
      'src/',
    ])
      .split('\n')
      .filter(Boolean),
    trackedFiles: git(['ls-files', 'src/']).split('\n').filter(Boolean),
  };
}

function readThresholds(base: string) {
  const headPath = path.join(ROOT, THRESHOLDS);
  return readThresholdPair(
    git,
    base,
    THRESHOLDS,
    existsSync(headPath) ? readFileSync(headPath, 'utf8') : null,
  );
}

/** --baseline-shard: which nightly shard's incremental report to restore. */
function chooseBaselineShard(): number {
  const base = resolveBaseRef(git, process.env.MUTATION_BASE_REF);
  const thresholds = readThresholds(base);
  // No baseline yet, so the plan lists every file the run may mutate.
  const plan = planPrRun({
    ...changedAndTracked(base),
    mutatePatterns: mutatePatterns(),
    baselineSources: null,
    readSource: (f) => readFileSync(path.join(ROOT, f), 'utf8'),
    raisedDirectories: thresholdRaises(thresholds.base, thresholds.head),
  });
  const shards = parseShards(
    readFileSync(path.join(ROOT, SHARDS), 'utf8'),
    SHARDS,
  );
  const choice = baselineShardFor(plan.mutate, shards);
  console.log(`Nightly baseline: ${choice.shard ?? 'none'} (${choice.reason})`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `shard=${choice.shard ?? ''}\n`);
  }
  return 0;
}

function main(): number {
  if (process.argv.includes('--baseline-shard')) return chooseBaselineShard();
  const started = Date.now();
  const base = resolveBaseRef(git, process.env.MUTATION_BASE_REF);

  const thresholds = readThresholds(base);
  const head = thresholds.head;
  const decreases = thresholdDecreases(thresholds.base, head, THRESHOLDS);
  if (decreases.length > 0) {
    summary(
      [
        '## Mutation testing (changed files)',
        '',
        '**Ratchet decreased**',
        '',
        ...decreases.map((d) => `- ${d}`),
      ].join('\n'),
    );
    return EXIT_RATCHET;
  }

  const baseline = readBaseline();
  const plan = planPrRun({
    ...changedAndTracked(base),
    mutatePatterns: mutatePatterns(),
    baselineSources: baseline.sources,
    readSource: (f) => readFileSync(path.join(ROOT, f), 'utf8'),
    raisedDirectories: thresholdRaises(thresholds.base, head),
  });

  if (plan.skip) {
    summary(
      [
        '## Mutation testing (changed files)',
        '',
        `Skipped: ${plan.reason} Nothing to mutate, so no directory ratchet applies. The nightly run still scores every directory.`,
      ].join('\n'),
    );
    return 0;
  }

  console.log(
    `Base ${base}. Changed in scope: ${plan.changed.join(', ')}.\nMutating ${plan.mutate.length} file(s) for directories ${plan.directories.join(', ')}.`,
  );
  runStryker(plan.mutate, process.argv.slice(2));

  const reportPath = path.join(ROOT, REPORT);
  if (!existsSync(reportPath)) {
    throw new Broken(`Stryker wrote no report at ${REPORT}.`);
  }
  const report = JSON.parse(readFileSync(reportPath, 'utf8')) as MutationReport;
  const { scores, failures } = gatePrRun(report, plan, head);
  const minutes = ((Date.now() - started) / 60000).toFixed(1);

  summary(
    renderPrSummary({
      plan,
      scores,
      thresholds: head,
      files: scoreFiles(report, plan.changed),
      undetected: undetectedMutants(report, plan.changed),
      failures,
      baseline: `${baseline.note} Wall time ${minutes} min.`,
    }),
  );
  return failures.length > 0 ? EXIT_RATCHET : 0;
}

try {
  process.exitCode = main();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  summary(
    `## Mutation testing (changed files)\n\n**Check broken:** ${message}`,
  );
  process.exitCode = EXIT_BROKEN;
}
