/**
 * npm run mutation:bdd:ratchet [-- --update]
 * npm run mutation:ratchet [-- --update]      (runs with --suite unit)
 *
 * Reads a Stryker JSON report, prints the per-directory score table (also to
 * $GITHUB_STEP_SUMMARY when set), and fails if any directory scores below its
 * floor.
 *
 * - BDD suite: reports/mutation-bdd/mutation.json, merged from the shard
 *   reports by npm run mutation:bdd:merge, against mutation-bdd-thresholds.json.
 *   Every scored directory needs an entry: the file was empty for as long as
 *   the run never finished, and a ratchet with nothing in it gates nothing,
 *   which is the failure this tier exists to catch. Seed it from a completed
 *   run with --update.
 * - Unit suite: reports/mutation/mutation.json against
 *   mutation-thresholds.json. Every scored directory needs an entry.
 *
 * --update raises entries to today's scores and never lowers one, so relaxing
 * a ratchet takes a reviewed edit to the thresholds file, which the pull
 * request job (npm run mutation:pr) rejects.
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import {
  MutationReport,
  applyRatchet,
  parseThresholds,
  renderTable,
  scoreByDirectory,
} from './mutation-ratchet-core';

const ROOT = path.resolve(__dirname, '..');

const SUITES = {
  bdd: {
    report: 'reports/mutation-bdd/mutation.json',
    thresholds: 'mutation-bdd-thresholds.json',
    heading: 'BDD-only mutation score',
    label: 'BDD mutation',
    column: 'BDD mutation score',
    requireEntry: true,
    run: 'npm run mutation:bdd && npm run mutation:bdd:merge',
  },
  unit: {
    report: 'reports/mutation/mutation.json',
    thresholds: 'mutation-thresholds.json',
    heading: 'Unit-suite mutation score',
    label: 'mutation',
    column: 'Mutation score',
    requireEntry: true,
    run: 'npm run mutation',
  },
} as const;

function main(): void {
  const suiteArg = process.argv.indexOf('--suite');
  const name = suiteArg === -1 ? 'bdd' : process.argv[suiteArg + 1];
  if (name !== 'bdd' && name !== 'unit') {
    console.error(`Unknown --suite ${String(name)}; expected bdd or unit.`);
    process.exit(2);
  }
  const suite = SUITES[name];
  const reportPath = path.join(ROOT, suite.report);
  const thresholdsPath = path.join(ROOT, suite.thresholds);

  if (!existsSync(reportPath)) {
    console.error(`No report at ${suite.report}. Run ${suite.run} first.`);
    process.exit(1);
  }
  if (!existsSync(thresholdsPath)) {
    console.error(`No thresholds file at ${suite.thresholds}; failing closed.`);
    process.exit(1);
  }
  const report = JSON.parse(readFileSync(reportPath, 'utf8')) as MutationReport;
  const thresholds = parseThresholds(
    readFileSync(thresholdsPath, 'utf8'),
    suite.thresholds,
  );

  const scores = scoreByDirectory(report);
  const table = renderTable(scores, thresholds, suite.column);
  const options = { label: suite.label, requireEntry: suite.requireEntry };
  const { raised } = applyRatchet(scores, thresholds, options);
  const update = process.argv.includes('--update');
  // After --update a directory that lacked an entry has one; a directory
  // below its floor still fails, because the floor was not lowered.
  const { failures } = applyRatchet(
    scores,
    update ? raised : thresholds,
    options,
  );

  console.log(table);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## ${suite.heading}\n\n${table}\n`,
    );
  }

  if (update) {
    writeFileSync(thresholdsPath, `${JSON.stringify(raised, null, 2)}\n`);
    console.log(`\nRaised ratchets written to ${suite.thresholds}.`);
  }

  if (failures.length > 0) {
    console.error(`\n${failures.join('\n')}`);
    process.exit(1);
  }
}

main();
