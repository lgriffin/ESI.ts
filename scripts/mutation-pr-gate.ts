/**
 * npm run mutation:pr:gate -- [args passed through to mutation:pr]
 *
 * Runs the pull request mutation check under a deadline and decides what its
 * outcome means. `scripts/mutation-ratchet-core.ts` holds the policy and the
 * reasoning; in short, a run that measured a regression blocks, and a run that
 * measured nothing because it ran out of time without the nightly baseline
 * warns.
 *
 * Environment:
 *   MUTATION_BASELINE_RESTORED  'true' when the cache restore hit
 *   MUTATION_PR_TIMEOUT_SECONDS deadline for the run (default 420)
 *   GITHUB_STEP_SUMMARY         appended to when set
 */
import { spawnSync } from 'child_process';
import { appendFileSync } from 'fs';
import * as path from 'path';

import { PR_EXIT, classifyPrMutationRun } from './mutation-ratchet-core';

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_TIMEOUT_SECONDS = 420;

function deadlineMs(): number {
  const raw = process.env.MUTATION_PR_TIMEOUT_SECONDS;
  const seconds = raw === undefined ? DEFAULT_TIMEOUT_SECONDS : Number(raw);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    console.error(
      `MUTATION_PR_TIMEOUT_SECONDS=${String(raw)} is not a positive number of seconds.`,
    );
    process.exit(PR_EXIT.broken);
  }
  return seconds * 1000;
}

/**
 * A pass is a plain log line. Annotating it would put a warning on every green
 * pull request, and an annotation nobody needs is how people learn to scroll
 * past the ones they do.
 */
function announce(
  outcome: { blocking: boolean; message: string },
  exitCode: number,
): void {
  if (exitCode === PR_EXIT.pass) {
    console.log(outcome.message);
    return;
  }
  const level = outcome.blocking ? 'error' : 'warning';
  console.log(`::${level}::${outcome.message}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `\n**Mutation gate:** ${outcome.blocking ? 'blocking' : 'not blocking'} — ${outcome.message}\n`,
    );
  }
}

function main(): void {
  const passthrough = process.argv.slice(2);
  const hadBaseline = process.env.MUTATION_BASELINE_RESTORED === 'true';

  console.log(
    hadBaseline
      ? 'Nightly baseline restored: only the changed files are re-mutated.'
      : 'No nightly baseline: every file in the touched directories is mutated from scratch.',
  );

  const run = spawnSync('npm', ['run', 'mutation:pr', '--', ...passthrough], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    timeout: deadlineMs(),
  });

  // spawnSync reports its own kill through `signal`, where a shell would have
  // given us 124. Normalise so the policy sees one shape.
  const exitCode =
    run.signal !== null && run.signal !== undefined
      ? PR_EXIT.timedOut
      : (run.status ?? PR_EXIT.broken);

  const outcome = classifyPrMutationRun({ exitCode, hadBaseline });
  announce(outcome, exitCode);
  process.exit(outcome.blocking ? exitCode || PR_EXIT.broken : 0);
}

main();
