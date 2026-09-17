/**
 * npm run mutation:fixture
 *
 * The mutation tier's signal on itself. Runs Stryker over the known-weak
 * fixture (stryker.fixture.config.mjs, tests/mutation-fixture/) and fails
 * unless the report shows a killed mutant, a surviving mutant, and a ratchet
 * failure for the survivor. The pull request mutation job runs this first.
 *
 * Exit codes: 0 the signal is intact, 1 it is not, 2 Stryker did not run.
 */
import { spawnSync } from 'child_process';
import { appendFileSync, existsSync, readFileSync } from 'fs';
import * as path from 'path';
import {
  MutationReport,
  fixtureSignalProblems,
  scoreByDirectory,
} from './mutation-ratchet-core';

const ROOT = path.resolve(__dirname, '..');
const REPORT = path.join(ROOT, 'reports/mutation-fixture/mutation.json');

function main(): number {
  const bin = path.join(
    ROOT,
    'node_modules/@stryker-mutator/core/bin/stryker.js',
  );
  const run = spawnSync(
    process.execPath,
    [bin, 'run', 'stryker.fixture.config.mjs'],
    { cwd: ROOT, stdio: 'inherit' },
  );
  if (run.status !== 0 || !existsSync(REPORT)) {
    console.error(
      `Stryker did not produce ${path.relative(ROOT, REPORT)} (exit ${run.status ?? run.signal}).`,
    );
    return 2;
  }

  const report = JSON.parse(readFileSync(REPORT, 'utf8')) as MutationReport;
  const problems = fixtureSignalProblems(report);
  const counts = new Map<string, number>();
  for (const { mutants } of Object.values(report.files)) {
    for (const { status } of mutants) {
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
  }
  const tally = [...counts.entries()].map(([s, n]) => `${s} ${n}`).join(', ');
  const score = scoreByDirectory(report)[0]?.score;
  const line =
    problems.length === 0
      ? `Known-weak fixture: ${tally}; score ${score}% fails a 100% floor, as it must.`
      : `Known-weak fixture lost its signal (${tally}):\n${problems.map((p) => `- ${p}`).join('\n')}`;

  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Mutation fixture\n\n${line}\n\n`,
    );
  }
  return problems.length === 0 ? 0 : 1;
}

process.exitCode = main();
