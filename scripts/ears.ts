/**
 * Standalone EARS check: is every requirement in the specification verified?
 *
 * One command, independent of `npm test` and the rest of CI:
 *
 *   1. runs the spec audit (`scripts/spec-audit.ts`): every `Rule:` is a
 *      well-formed EARS requirement with scenarios beneath it;
 *   2. runs the BDD scenarios that verify those requirements (Jest, the unit
 *      config), recording results as JSON;
 *   3. joins the run to the feature files and gives each requirement a
 *      verdict: verified, failing, or not run;
 *   4. writes `reports/ears/ears-report.md` (verdicts, advisory feedback on
 *      the specification, every requirement by feature) and
 *      `reports/ears/ears-report.json`, and prints the ones not verified.
 *
 * Exits 1 when the audit fails or any requirement is not verified.
 *
 * Usage:
 *   npm run ears
 *   npm run ears -- --only=market          # features whose path contains "market"
 *   npm run ears -- --results=<jest json>  # report an existing run, run nothing
 *   npm run ears -- --skip-audit
 *   npm run ears -- --out=<dir>            # default reports/ears
 */
import { spawnSync } from 'child_process';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'fs';
import * as path from 'path';

import { outlineFeature } from '../tests/bdd/support/outline';
import {
  JestResults,
  buildLedger,
  readFeatures,
  toJUnit,
} from './bdd-report-core';
import {
  AuditResult,
  OutlineSummary,
  buildReport,
  reportFails,
  toConsole,
  toMarkdown,
} from './ears-core';
import { featureBindings } from './spec-audit-steps';

const ROOT = path.resolve(__dirname, '..');
const FEATURES = 'tests/bdd/features';
const IS_CI = process.env.GITHUB_ACTIONS === 'true';

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv
    .slice(2)
    .find((a) => a.startsWith(prefix))
    ?.slice(prefix.length);
}

function flag(name: string): boolean {
  return process.argv.slice(2).includes(`--${name}`);
}

function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  if (IS_CI) console.log(`::error::${message}`);
  process.exit(1);
}

function featureFiles(rel: string): string[] {
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .sort()
    .flatMap((entry) => {
      const child = `${rel}/${entry}`;
      if (statSync(path.join(ROOT, child)).isDirectory())
        return featureFiles(child);
      return entry.endsWith('.feature') ? [child] : [];
    });
}

function npx(args: string[]): number {
  const result = spawnSync('npx', args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return result.status ?? 1;
}

function runAudit(): AuditResult {
  if (flag('skip-audit')) return 'skipped';
  console.log('\n> Spec audit: are the requirements well-formed EARS?\n');
  return npx(['ts-node', 'scripts/spec-audit.ts']) === 0 ? 'passed' : 'failed';
}

/** Run the scenarios bound to `features` and return Jest's JSON results. */
function runScenarios(
  features: readonly string[],
  bindings: ReadonlyMap<string, readonly string[]>,
  only: string | undefined,
  out: string,
): JestResults {
  const resultsPath = path.join(out, 'jest-results.json');
  rmSync(resultsPath, { force: true });

  const target = only
    ? [
        '--runTestsByPath',
        ...new Set(features.flatMap((f) => bindings.get(f) ?? [])),
      ]
    : ['--testPathPatterns=tests/bdd/'];
  if (only && target.length === 1) {
    fail(
      `No test file binds a feature matching --only=${only}; nothing would run.`,
    );
  }

  console.log('\n> Running the scenarios that verify each requirement\n');
  // A failing scenario exits Jest non-zero; the report decides the outcome.
  npx([
    'jest',
    '--config',
    'config/jest/unit.config.cjs',
    '--verbose=false',
    '--json',
    `--outputFile=${resultsPath}`,
    ...target,
  ]);

  if (!existsSync(resultsPath)) {
    fail(
      'Jest wrote no results, so no requirement can be shown to hold. See its output above.',
    );
  }
  return JSON.parse(readFileSync(resultsPath, 'utf-8')) as JestResults;
}

function main(): void {
  const only = arg('only');
  const out = path.resolve(ROOT, arg('out') ?? 'reports/ears');
  const given = arg('results');
  mkdirSync(out, { recursive: true });

  const features = featureFiles(FEATURES).filter(
    (f) => !only || f.includes(only),
  );
  if (features.length === 0) {
    fail(
      only
        ? `No feature under ${FEATURES} matches --only=${only}.`
        : `No .feature files under ${FEATURES}.`,
    );
  }

  const audit = runAudit();
  const bindings = featureBindings(ROOT);

  let results: JestResults;
  if (given) {
    try {
      results = JSON.parse(
        readFileSync(path.resolve(ROOT, given), 'utf-8'),
      ) as JestResults;
      if (!Array.isArray(results.testResults))
        throw new Error('no testResults array');
    } catch (error) {
      fail(`${given} is not Jest JSON output: ${(error as Error).message}`);
    }
  } else {
    results = runScenarios(features, bindings, only, out);
  }

  const sources = readFeatures(ROOT, features);
  const ledger = buildLedger(ROOT, sources, bindings, results);
  const outlines: OutlineSummary[] = sources.map(({ file, source }) => {
    const outline = outlineFeature(source);
    return {
      file,
      feature: outline.title,
      rules: outline.rules.map((r) => ({
        title: r.title,
        line: r.line,
        scenarios: r.scenarios.length,
      })),
    };
  });

  const report = buildReport(outlines, ledger.cases, audit);
  const markdown = toMarkdown(report, new Date().toISOString());

  writeFileSync(path.join(out, 'ears-report.md'), markdown);
  writeFileSync(
    path.join(out, 'ears-report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  writeFileSync(path.join(out, 'junit.xml'), toJUnit(ledger));

  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) {
    // Everything but the per-requirement listing, which the artifact carries.
    appendFileSync(summary, markdown.split('\n## Every requirement')[0] ?? '');
  }

  console.log(toConsole(report));
  console.log(
    `\nReport: ${path.relative(ROOT, path.join(out, 'ears-report.md'))}`,
  );

  if (IS_CI) {
    for (const r of report.requirements.filter(
      (x) => x.verdict !== 'verified',
    )) {
      console.log(
        `::error file=${r.file},line=${r.line}::${r.id} ${r.verdict}: ${r.evidence.replace(/\r?\n/g, ' ')}`,
      );
    }
  }

  if (reportFails(report)) process.exit(1);
}

main();
