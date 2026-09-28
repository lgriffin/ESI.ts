/**
 * npm run spec:coverage:sde [-- --ci] [-- --write-baseline] [-- --root <dir>]
 *
 * Prints, for every IStaticDataProvider method, how many Rules and scenarios
 * of tests/bdd/features/sde reach it, and the uncovered methods grouped by
 * entity family. See sde-spec-coverage-core.ts for what counts as coverage.
 *
 * Exit 2 means the check itself is broken. When
 * scripts/sde/sde-spec-coverage-baseline.json exists, the report also fails
 * (exit 1) on an uncovered method it does not list under its family and on an
 * entry that is now covered, no longer a method or under the wrong family,
 * which needs no git history, so `check:local` runs it. --ci also fails on a
 * method absent from the base branch's copy: SDE_SPEC_COVERAGE_BASE_REF, then
 * origin/master, then master; with none available every entry counts as
 * added.
 *
 * --write-baseline rewrites the baseline from today's result; --ci still
 * rejects any method it adds.
 */
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import * as path from 'path';

import {
  BASELINE_FILE,
  type BaseBaseline,
  EXIT_INTEGRITY,
  EXIT_RATCHET,
  analyseCoverage,
  applyBaseline,
  integrityProblems,
  loadBaseBaseline,
  parseBaseline,
  ratchetProblems,
  renderReport,
  serializeBaseline,
} from './sde-spec-coverage-core';

function main(): number {
  const args = process.argv.slice(2);
  const ci = args.includes('--ci');
  const rootIndex = args.indexOf('--root');
  const root =
    rootIndex >= 0 && args[rootIndex + 1]
      ? path.resolve(args[rootIndex + 1]!)
      : path.resolve(__dirname, '../..');

  const report = analyseCoverage(root);
  const rendered = renderReport(report);
  console.log(rendered);

  const broken = integrityProblems(report);
  if (broken.length > 0) {
    for (const problem of broken) console.error(`[ERROR] ${problem}`);
    return EXIT_INTEGRITY;
  }

  const baselinePath = path.join(root, BASELINE_FILE);
  if (args.includes('--write-baseline')) {
    mkdirSync(path.dirname(baselinePath), { recursive: true });
    writeFileSync(baselinePath, serializeBaseline(report));
    console.log(`\nBaseline written to ${BASELINE_FILE}.`);
  }
  if (!ci && !existsSync(baselinePath)) return 0;

  const baseline = existsSync(baselinePath)
    ? parseBaseline(readFileSync(baselinePath, 'utf-8'))
    : {};
  const hasEntries = Object.values(baseline).some((names) => names.length > 0);
  let base: BaseBaseline | null = null;
  if (ci) {
    base = hasEntries
      ? loadBaseBaseline(
          root,
          [
            process.env.SDE_SPEC_COVERAGE_BASE_REF,
            'origin/master',
            'master',
          ].filter((ref): ref is string => Boolean(ref)),
        )
      : { ref: null, baseline: {} };
    if (hasEntries && base.ref !== null && base.baseline === null) {
      console.log(
        `\n${base.ref} has no ${BASELINE_FILE} yet; additions are not checked until it does.`,
      );
    }
  }

  const problems = ratchetProblems(applyBaseline(report, baseline, base));
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## SDE specification coverage\n\n\`\`\`\n${rendered}\n\`\`\`\n`,
    );
  }
  if (problems.length === 0) {
    console.log('\nSDE specification coverage matches the baseline.');
    return 0;
  }
  for (const problem of problems) {
    console.error(`\n[ERROR] ${problem}`);
    if (process.env.GITHUB_ACTIONS === 'true') {
      console.log(`::error file=${BASELINE_FILE}::${problem}`);
    }
  }
  return EXIT_RATCHET;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`[ERROR] ${(error as Error).message}`);
  process.exitCode = EXIT_INTEGRITY;
}
