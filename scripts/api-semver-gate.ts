/**
 * npm run api-report:semver [-- --base <rev> --head <rev> --pr-head <rev>]
 *
 * Fails when the public API report (`etc/esi.ts.api.md`) lost or changed a
 * line and no commit in the pull request declares a breaking change. See
 * `api-semver-gate-core.ts` for the rules.
 *
 * Defaults fit the `pull_request` checkout in CI, where HEAD is GitHub's
 * merge commit: the report is compared between the base tip (HEAD^1) and the
 * merge result (HEAD), and the commits read are those the pull request adds
 * (HEAD^1..HEAD^2). Locally, on a feature branch:
 *
 *   npm run api-report:semver -- --base $(git merge-base origin/master HEAD) --pr-head HEAD
 *
 * The pull request title comes from `--pr-title`, or in CI from the GitHub
 * API for `PR_NUMBER`. It is fetched rather than taken from the event
 * payload because a re-run replays the original payload: after fixing the
 * title, re-running the job has to see the new one.
 */
import { execFileSync } from 'child_process';
import { appendFileSync } from 'fs';
import * as path from 'path';
import {
  diffReports,
  evaluateGate,
  readCommitMessages,
  readReportAt,
} from './api-semver-gate-core';

const ROOT = path.resolve(__dirname, '..');

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  const value = index === -1 ? undefined : process.argv[index + 1];
  return value ?? fallback;
}

function pullRequestTitle(): string | null {
  const index = process.argv.indexOf('--pr-title');
  if (index !== -1) return process.argv[index + 1] ?? null;
  const number = process.env.PR_NUMBER;
  if (!number) return null;
  return execFileSync(
    'gh',
    ['pr', 'view', number, '--json', 'title', '--jq', '.title'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ).trim();
}

function main(): void {
  const base = arg('base', 'HEAD^1');
  const head = arg('head', 'HEAD');
  const prHead = arg('pr-head', 'HEAD^2');

  const diff = diffReports(readReportAt(base, ROOT), readReportAt(head, ROOT));
  const commits = readCommitMessages(base, prHead, ROOT);
  const result = evaluateGate(diff, commits, { prTitle: pullRequestTitle() });

  const summary = [
    '## API SemVer gate',
    '',
    `Verdict: \`${result.verdict}\` (${diff.removed.length} line(s) removed or changed, ${diff.added.length} added, ${commits.length} commit(s) read)`,
    '',
    '```',
    result.message,
    '```',
    '',
  ].join('\n');
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }

  if (result.ok) {
    console.log(result.message);
    return;
  }
  console.error(result.message);
  if (process.env.GITHUB_ACTIONS) {
    console.error(
      '::error file=etc/esi.ts.api.md::Public API lost or changed lines without a breaking-change commit',
    );
  }
  process.exit(1);
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(2);
}
