/**
 * Report a BDD run against the specification, and fail when a scenario the
 * feature files state did not execute.
 *
 * Reads the Jest JSON results of a full `npm run bdd`, then:
 *
 *   - writes a JUnit XML report whose test cases are named
 *     `Feature › Rule › Scenario`, so a CI report shows which requirement a
 *     failure breaks, whichever runner (spec entry or legacy step file) ran it;
 *   - appends a summary table to `$GITHUB_STEP_SUMMARY` when that is set;
 *   - exits 1 when any scenario did not execute: its feature is bound to no
 *     test file, its test file is missing from the run or failed to load, or
 *     no executed test carries the scenario's title.
 *
 * A failing scenario is reported but does not fail this script: `npm run bdd`
 * owns that failure, and this owns the ones Jest cannot see.
 *
 * Usage:
 *   mkdir -p reports/bdd   (Jest does not create the directory)
 *   npm run bdd -- --json --outputFile=reports/bdd/jest-results.json
 *   npm run bdd:report
 *
 *   npx ts-node scripts/bdd-report.ts [--results=<json>] [--junit=<xml>]
 *     [--summary=<md>] [--root=<dir>]
 *
 * `--root` points the report at a miniature repository (the unit fixtures);
 * results paths are resolved against it.
 */
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'fs';
import * as path from 'path';

import {
  JestResults,
  Ledger,
  buildLedger,
  readFeatures,
  toJUnit,
  toSummary,
} from './bdd-report-core';
import { featureBindings } from './spec-audit-steps';

const REPO_ROOT = path.resolve(__dirname, '..');
const FEATURES = 'tests/bdd/features';
const IS_CI = process.env.GITHUB_ACTIONS === 'true';

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv
    .slice(2)
    .find((a) => a.startsWith(prefix))
    ?.slice(prefix.length);
}

function featureFiles(root: string, rel: string): string[] {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .sort()
    .flatMap((entry) => {
      const child = `${rel}/${entry}`;
      if (statSync(path.join(root, child)).isDirectory())
        return featureFiles(root, child);
      return entry.endsWith('.feature') ? [child] : [];
    });
}

function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  if (IS_CI) console.log(`::error::${message}`);
  process.exit(1);
}

function main(): void {
  const root = path.resolve(REPO_ROOT, arg('root') ?? '.');
  const resultsPath = path.resolve(
    root,
    arg('results') ?? 'reports/bdd/jest-results.json',
  );
  const junitPath = path.resolve(root, arg('junit') ?? 'reports/bdd/junit.xml');
  const summaryPath = arg('summary') ?? process.env.GITHUB_STEP_SUMMARY;

  if (!existsSync(resultsPath)) {
    fail(
      `${path.relative(REPO_ROOT, resultsPath)} does not exist, so no scenario can be shown to have run. ` +
        'Run the BDD suite with --json --outputFile=<that path> first: ' +
        'mkdir -p reports/bdd && npm run bdd -- --json --outputFile=reports/bdd/jest-results.json',
    );
  }

  let results: JestResults;
  try {
    results = JSON.parse(readFileSync(resultsPath, 'utf-8')) as JestResults;
    if (!Array.isArray(results.testResults))
      throw new Error('no testResults array');
  } catch (error) {
    fail(
      `${path.relative(REPO_ROOT, resultsPath)} is not Jest JSON output: ${(error as Error).message}`,
    );
  }

  const files = featureFiles(root, FEATURES);
  if (files.length === 0)
    fail(`No .feature files under ${path.join(root, FEATURES)}.`);

  const ledger: Ledger = buildLedger(
    root,
    readFeatures(root, files),
    featureBindings(root),
    results,
  );

  mkdirSync(path.dirname(junitPath), { recursive: true });
  writeFileSync(junitPath, toJUnit(ledger));
  if (summaryPath) appendFileSync(summaryPath, toSummary(ledger));

  const count = (status: string) =>
    ledger.cases.filter((c) => c.status === status).length;
  console.log(
    `BDD specification: ${ledger.features} features, ${ledger.rules} rules, ${ledger.cases.length} scenarios — ` +
      `${count('passed')} passed, ${count('failed')} failed, ${count('not-executed')} not executed.`,
  );
  console.log(`JUnit report: ${path.relative(REPO_ROOT, junitPath)}`);

  for (const finding of ledger.findings) {
    console.error(
      `  [ERROR] ${finding.file}:${finding.line} (${finding.check}) ${finding.message}`,
    );
    if (IS_CI) {
      console.log(
        `::error file=${finding.file},line=${finding.line}::${finding.message.replace(/\r?\n/g, ' ')}`,
      );
    }
  }

  if (ledger.findings.length > 0) {
    console.error(
      `\nFAIL: ${count('not-executed')} scenario(s) stated in the feature files did not execute, ` +
        'so their Rules are documentation, not protection.',
    );
    process.exit(1);
  }
  console.log('PASS: every scenario in the specification executed.');
}

main();
