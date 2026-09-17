/**
 * npm run test:type-mutation [-- --ratchet] [-- --update] [--max N] [--seed N] [--workers N]
 *
 * Mutates the built declarations (`dist/**\/*.d.ts`, so run `npm run build`
 * first) one edit at a time and runs the tsd suite against each mutant. A
 * mutant tsd still passes against is a promise in the public types that no
 * type test pins down.
 *
 * Mutants come from the public surface only (what the `exports` entries
 * reach), sampled deterministically: the seed is printed, and the same seed
 * and surface give the same sample. The report goes to
 * reports/type-mutation/ (JSON and Markdown) and $GITHUB_STEP_SUMMARY.
 *
 * --ratchet fails when an entry point scores below its floor in
 * scripts/type-mutation-thresholds.json, when a floor names an entry point
 * that scored nothing, or when the file lowers or drops a floor relative to
 * the base ref (TYPE_MUTATION_BASE_REF, origin/master, master; no ref fails
 * closed). --update raises floors to today's scores and never lowers one.
 */
import { execFileSync } from 'child_process';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  MutantResult,
  Thresholds,
  applyRatchet,
  renderScoreTable,
  renderSurvivors,
  scoreByEntryPoint,
} from './type-mutation-core';
import { runTypeMutation } from './type-mutation-run';

const ROOT = path.resolve(__dirname, '..');
const THRESHOLDS = path.join(ROOT, 'scripts/type-mutation-thresholds.json');
const REPORT_DIR = path.join(ROOT, 'reports/type-mutation');
const TEST_DIR = 'tests/typetests';

/** The sample the ratchet is measured on. Changing either rescales every floor. */
const DEFAULT_SEED = 1;
const DEFAULT_MAX = 500;

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i === -1 ? undefined : process.argv[i + 1];
}

function intFlag(name: string, fallback: number): number {
  const raw = flag(name);
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    console.error(`${name} expects a non-negative integer, got ${raw}`);
    process.exit(2);
  }
  return n;
}

function loadBaselineThresholds(): {
  baseline: Thresholds | null | undefined;
  ref: string | null;
} {
  const rel = path.relative(ROOT, THRESHOLDS).split(path.sep).join('/');
  const refs = [
    process.env.TYPE_MUTATION_BASE_REF,
    'origin/master',
    'master',
  ].filter((r): r is string => Boolean(r));
  for (const ref of refs) {
    try {
      execFileSync(
        'git',
        ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`],
        {
          cwd: ROOT,
          stdio: 'ignore',
        },
      );
    } catch {
      continue; // Ref not available in this checkout; try the next one.
    }
    let raw: string;
    try {
      raw = execFileSync('git', ['show', `${ref}:${rel}`], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      return { baseline: null, ref }; // The file is being introduced.
    }
    try {
      return { baseline: JSON.parse(raw) as Thresholds, ref };
    } catch {
      continue; // Baseline file is unparseable; treat the ref as unusable.
    }
  }
  return { baseline: undefined, ref: null };
}

function testFiles(): string[] {
  const dir = path.join(ROOT, TEST_DIR);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.test-d.ts'))
    .sort()
    .map((f) => `${TEST_DIR}/${f}`);
}

async function main(): Promise<void> {
  const ratchet = process.argv.includes('--ratchet');
  const update = process.argv.includes('--update');
  const seed = intFlag('--seed', DEFAULT_SEED);
  const max = intFlag('--max', DEFAULT_MAX);
  const cores =
    typeof os.availableParallelism === 'function'
      ? os.availableParallelism()
      : os.cpus().length;
  const workers = intFlag('--workers', Math.max(1, cores));

  if ((ratchet || update) && (seed !== DEFAULT_SEED || max !== DEFAULT_MAX)) {
    console.error(
      `--ratchet and --update score the default sample (--seed ${DEFAULT_SEED} --max ${DEFAULT_MAX}); the floors mean nothing for another sample.`,
    );
    process.exit(2);
  }

  console.log(
    `Type mutation: seed ${seed}, at most ${max} mutants, ${workers} workers`,
  );
  const started = Date.now();
  const run = await runTypeMutation({
    packageRoot: ROOT,
    declarationDir: 'dist',
    testFiles: testFiles(),
    rewriteImportsFrom: 'src',
    workDir: path.join(REPORT_DIR, 'work'),
    maxMutants: max,
    seed,
    workers,
    onProgress: (done, total, r: MutantResult) => {
      if (done % 25 === 0 || done === total) {
        console.log(
          `  ${done}/${total} (${Math.round((Date.now() - started) / 1000)}s)`,
        );
      }
      if (r.status === 'Survived' && process.env.TYPE_MUTATION_VERBOSE) {
        console.log(
          `  survived: ${r.file}:${r.line} ${r.symbol} ${r.operator}`,
        );
      }
    },
  });

  const names = run.entryPoints.map((e) => e.name);
  const scores = scoreByEntryPoint(run.results, names);
  const thresholds = existsSync(THRESHOLDS)
    ? (JSON.parse(readFileSync(THRESHOLDS, 'utf8')) as Thresholds)
    : {};
  const table = renderScoreTable(scores, thresholds);
  const survivors = renderSurvivors(run.results);
  const seconds = Math.round((Date.now() - started) / 1000);
  const candidates = names
    .map((n) => `\`${n}\` ${run.candidates[n]}`)
    .join(', ');
  const summary = [
    `Seed ${seed}; ${run.results.length} of ${run.totalCandidates} candidate mutants run in ${seconds}s.`,
    `Candidates per entry point: ${candidates}.`,
  ].join('\n');

  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(
    path.join(REPORT_DIR, 'type-mutation.json'),
    `${JSON.stringify(
      {
        seed,
        maxMutants: max,
        totalCandidates: run.totalCandidates,
        candidates: run.candidates,
        durationSeconds: seconds,
        scores,
        mutants: run.results.map(
          ({ start: _s, end: _e, replacement: _r, ...rest }) => rest,
        ),
      },
      null,
      2,
    )}\n`,
  );
  const markdown = `## Type mutation score\n\n${summary}\n\n${table}\n\n### Surviving mutants\n\n${survivors}\n`;
  writeFileSync(path.join(REPORT_DIR, 'type-mutation.md'), markdown);

  console.log(`\n${summary}\n\n${table}\n`);
  const survivorCount = run.results.filter(
    (r) => r.status === 'Survived',
  ).length;
  console.log(
    `${survivorCount} surviving mutants; see ${path.relative(ROOT, path.join(REPORT_DIR, 'type-mutation.md'))}.`,
  );
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  }

  if (!ratchet && !update) return;

  const { baseline, ref } = loadBaselineThresholds();
  const { failures, raised } = applyRatchet({
    scores,
    thresholds,
    baseline,
    baseRef: ref,
  });
  if (update) {
    writeFileSync(THRESHOLDS, `${JSON.stringify(raised, null, 2)}\n`);
    console.log(
      `\nRaised ratchets written to ${path.relative(ROOT, THRESHOLDS)}.`,
    );
  }
  if (ratchet && failures.length > 0) {
    console.error(`\n${failures.join('\n')}`);
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
