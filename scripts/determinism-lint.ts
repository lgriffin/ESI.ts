/**
 * npm run lint:determinism [-- --update]
 *
 * Lints src/ with eslint.determinism.rules.cjs (wall-clock reads, real timers
 * and Math.random() outside the clock module), counts the sites per file and
 * construct, and checks them against scripts/determinism-baseline.json, which
 * only shrinks. See scripts/determinism-lint-core.ts for the ratchet rules.
 *
 * --update lowers baseline entries to today's counts. It never raises one.
 *
 * Exit codes: 0 clean, 1 ratchet failed, 2 the check itself is broken.
 */
import { execFileSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import {
  BaseBaseline,
  DeterminismBaseline,
  applyRatchet,
  collectSites,
  countSites,
  createDeterminismLinter,
  emptyBaseline,
  integrityProblems,
  lowerBaseline,
  parseBaseline,
  ratchetProblems,
  serializeBaseline,
} from './determinism-lint-core';

const REPO_ROOT = path.resolve(__dirname, '..');
const BASELINE_PATH = path.join(__dirname, 'determinism-baseline.json');

function loadBaseline(): DeterminismBaseline | null {
  if (!existsSync(BASELINE_PATH)) return null;
  return parseBaseline(readFileSync(BASELINE_PATH, 'utf-8'));
}

/**
 * The baseline on the integration branch. DETERMINISM_BASE_REF comes first,
 * then origin/master and master; CI fetches origin/master explicitly because a
 * pull request checkout is shallow.
 */
function loadBaseBaseline(): BaseBaseline {
  const relPath = path
    .relative(REPO_ROOT, BASELINE_PATH)
    .split(path.sep)
    .join('/');
  const refs = [
    process.env.DETERMINISM_BASE_REF,
    'origin/master',
    'master',
  ].filter((ref): ref is string => Boolean(ref));

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
      raw = git(['show', `${ref}:${relPath}`]);
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
  const eslint = createDeterminismLinter(REPO_ROOT);
  const outcome = collectSites(REPO_ROOT, await eslint.lintFiles(['src']));

  const broken = integrityProblems(outcome);
  if (broken.length > 0) {
    console.error(broken.join('\n'));
    return 2;
  }

  const current = countSites(outcome.sites);
  const baseline = loadBaseline();

  if (process.argv.includes('--update')) {
    writeFileSync(
      BASELINE_PATH,
      serializeBaseline(lowerBaseline(current, baseline)),
    );
    console.log(`Baseline written to scripts/determinism-baseline.json.`);
    return 0;
  }

  const base = loadBaseBaseline();
  const result = applyRatchet(current, baseline ?? emptyBaseline(), base);
  const problems = ratchetProblems(result, outcome.sites);

  const files = Object.keys(current).length;
  console.log(
    `Determinism lint: ${outcome.filesLinted} files linted, ${outcome.sites.length} restricted sites in ${files} files ` +
      `(base: ${base.ref ?? 'none'}).`,
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
