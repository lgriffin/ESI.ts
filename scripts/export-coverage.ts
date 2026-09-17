/**
 * npm run test:export-coverage [-- --ci] [-- --write-baseline] [-- --root <dir>]
 *
 * Prints every public export (per package.json `exports` entry) that no file
 * under tests/ references, grouped by entry point. See export-coverage-core.ts
 * for what counts as a reference.
 *
 * Report mode exits 0 unless the check is broken (exit 2). --ci also fails
 * (exit 1) on an unreferenced export missing from
 * scripts/export-coverage-baseline.json, on a baseline entry that is now
 * referenced or no longer exported, and on a baseline entry absent from the
 * base branch's copy. The base is EXPORT_COVERAGE_BASE_REF, then origin/master,
 * then master; with none of them available every entry counts as added.
 *
 * --root points the check at another project (the Jest suite's fixture).
 * --write-baseline rewrites the baseline from today's result; the ratchet
 * still rejects any entry it adds.
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import {
  BASELINE_FILE,
  EXIT_INTEGRITY,
  EXIT_RATCHET,
  analyseExportCoverage,
  applyBaseline,
  collectTestFiles,
  entryPointsFromPackage,
  integrityProblems,
  loadBaseBaseline,
  parseBaseline,
  ratchetProblems,
  renderReport,
  serializeBaseline,
} from './export-coverage-core';

function main(): number {
  const args = process.argv.slice(2);
  const ci = args.includes('--ci');
  const rootIndex = args.indexOf('--root');
  const root =
    rootIndex >= 0 && args[rootIndex + 1]
      ? path.resolve(args[rootIndex + 1]!)
      : path.resolve(__dirname, '..');

  const started = Date.now();
  const packageName = (
    JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf-8')) as {
      name?: string;
    }
  ).name;
  const report = analyseExportCoverage({
    root,
    entries: entryPointsFromPackage(root),
    testFiles: collectTestFiles(root),
    packageName,
  });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  const rendered = renderReport(report);
  console.log(rendered);
  console.log(`\n${report.testFileCount} test files read in ${seconds}s.`);

  const broken = integrityProblems(report);
  if (broken.length > 0) {
    for (const problem of broken) console.error(`[ERROR] ${problem}`);
    return EXIT_INTEGRITY;
  }

  const baselinePath = path.join(root, BASELINE_FILE);
  if (args.includes('--write-baseline')) {
    writeFileSync(baselinePath, serializeBaseline(report));
    console.log(`Baseline written to ${BASELINE_FILE}.`);
  }
  if (!ci) return 0;

  const baseline = existsSync(baselinePath)
    ? parseBaseline(readFileSync(baselinePath, 'utf-8'))
    : {};
  const hasEntries = Object.values(baseline).some((names) => names.length > 0);
  // Only a non-empty baseline needs the base branch, so an empty one needs no git.
  const base = hasEntries
    ? loadBaseBaseline(
        root,
        [
          process.env.EXPORT_COVERAGE_BASE_REF,
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

  const problems = ratchetProblems(applyBaseline(report, baseline, base));
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Export coverage\n\n\`\`\`\n${rendered}\n\`\`\`\n`,
    );
  }
  if (problems.length === 0) {
    console.log('\nExport coverage matches the baseline.');
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
