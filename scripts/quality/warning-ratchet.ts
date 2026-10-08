/**
 * npm run lint:ratchet [-- --update]
 *
 * Runs the main ESLint config over src/, tests/ and scripts/ (what
 * `npm run lint` runs), fails on any error, and holds the warnings per file
 * and rule to config/eslint/warning-baseline.json, which only shrinks. See
 * scripts/quality/warning-ratchet-core.ts for the ratchet rules.
 *
 * --update lowers baseline entries to today's counts. It never raises one,
 * except to bootstrap a missing file.
 *
 * Exit codes: 0 clean, 1 lint errors or the ratchet failed, 2 the check
 * itself is broken.
 */
import { execFileSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import { ESLint } from 'eslint';
import {
  BaseBaseline,
  WarningBaseline,
  applyRatchet,
  collectWarnings,
  countWarnings,
  emptyBaseline,
  errorProblems,
  integrityProblems,
  lowerBaseline,
  parseBaseline,
  ratchetProblems,
  serializeBaseline,
  totalsByRule,
  updateProblems,
} from './warning-ratchet-core';

const REPO_ROOT = path.resolve(__dirname, '../..');
const BASELINE_REL = 'config/eslint/warning-baseline.json';
const BASELINE_PATH = path.join(REPO_ROOT, BASELINE_REL);
const LINTED = ['src', 'tests', 'scripts'];

function loadBaseline(): WarningBaseline | null {
  if (!existsSync(BASELINE_PATH)) return null;
  return parseBaseline(readFileSync(BASELINE_PATH, 'utf-8'));
}

/**
 * The baseline on the integration branch. WARNING_BASE_REF comes first (CI
 * sets it to the pull request's fetched target branch, since the checkout is
 * shallow), then origin/master and master for local runs.
 */
function loadBaseBaseline(): BaseBaseline {
  const refs = [process.env.WARNING_BASE_REF, 'origin/master', 'master'].filter(
    (ref): ref is string => Boolean(ref),
  );
  const git = (args: string[]) =>
    execFileSync('git', args, {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

  for (const ref of refs) {
    try {
      git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
    } catch {
      continue; // Ref not available in this checkout; try the next one.
    }
    let raw: string;
    try {
      raw = git(['show', `${ref}:${BASELINE_REL}`]);
    } catch {
      return { ref, baseline: null }; // The ref predates the baseline file.
    }
    try {
      return { ref, baseline: parseBaseline(raw) };
    } catch {
      // An unreadable base copy cannot vouch for any entry: fail closed.
      return { ref, baseline: emptyBaseline() };
    }
  }
  return { ref: null, baseline: null };
}

async function main(): Promise<number> {
  const eslint = new ESLint({ cwd: REPO_ROOT });
  const outcome = collectWarnings(REPO_ROOT, await eslint.lintFiles(LINTED));

  const broken = integrityProblems(outcome);
  if (broken.length > 0) {
    console.error(broken.join('\n'));
    return 2;
  }

  const current = countWarnings(outcome.warnings);
  const baseline = loadBaseline();

  if (process.argv.includes('--update')) {
    const lowered = lowerBaseline(current, baseline);
    writeFileSync(BASELINE_PATH, serializeBaseline(lowered));
    console.log(`Baseline written to ${BASELINE_REL}.`);
    const left = updateProblems(current, lowered, outcome);
    if (left.length > 0) {
      console.error(`\n${left.join('\n\n')}`);
      return 1;
    }
    return 0;
  }

  const base = loadBaseBaseline();
  const result = applyRatchet(current, baseline ?? emptyBaseline(), base);
  const problems = [
    ...errorProblems(outcome.errors),
    ...ratchetProblems(result, outcome.warnings),
  ];

  const top = totalsByRule(current)
    .slice(0, 5)
    .map(([rule, n]) => `${rule} ${n}`)
    .join(', ');
  console.log(
    `Warning ratchet: ${outcome.filesLinted} files linted, ${outcome.warnings.length} warnings, ${outcome.errors.length} errors ` +
      `(base: ${base.ref ?? 'none'}). Most: ${top || 'none'}.`,
  );
  if (problems.length > 0) {
    console.error(`\n${problems.join('\n\n')}`);
    return 1;
  }
  return 0;
}

main().then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(error);
    process.exit(2);
  },
);
