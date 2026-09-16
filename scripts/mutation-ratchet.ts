/**
 * npm run mutation:bdd:ratchet [-- --update]
 *
 * Reads the BDD-only Stryker JSON report, prints the per-directory score
 * table (also to $GITHUB_STEP_SUMMARY when set), and fails if any directory
 * scores below its entry in mutation-bdd-thresholds.json. A directory with no
 * entry is reported but not gated. --update raises entries to today's scores
 * and never lowers one, so relaxing a ratchet takes a reviewed edit to the
 * thresholds file.
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import {
  MutationReport,
  Thresholds,
  applyRatchet,
  renderTable,
  scoreByDirectory,
} from './mutation-ratchet-core';

const ROOT = path.resolve(__dirname, '..');
const REPORT = path.join(ROOT, 'reports/mutation-bdd/mutation.json');
const THRESHOLDS = path.join(ROOT, 'mutation-bdd-thresholds.json');

function main(): void {
  if (!existsSync(REPORT)) {
    console.error(
      `No report at ${path.relative(ROOT, REPORT)}. Run npm run mutation:bdd first.`,
    );
    process.exit(1);
  }
  const report = JSON.parse(readFileSync(REPORT, 'utf8')) as MutationReport;
  const thresholds = JSON.parse(readFileSync(THRESHOLDS, 'utf8')) as Thresholds;

  const scores = scoreByDirectory(report);
  const table = renderTable(scores, thresholds);
  const { failures, raised } = applyRatchet(scores, thresholds);

  console.log(table);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## BDD-only mutation score\n\n${table}\n`,
    );
  }

  if (process.argv.includes('--update')) {
    writeFileSync(THRESHOLDS, `${JSON.stringify(raised, null, 2)}\n`);
    console.log(`\nRaised ratchets written to ${path.basename(THRESHOLDS)}.`);
  }

  if (failures.length > 0) {
    console.error(`\n${failures.join('\n')}`);
    process.exit(1);
  }
}

main();
