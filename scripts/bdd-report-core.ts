/**
 * The BDD run, read back against the specification.
 *
 * `npm run bdd` proves the scenarios Jest ran passed. It cannot prove Jest ran
 * every scenario the feature files state: a spec entry outside `testMatch`, a
 * step file whose suite fails to load, a `test.skip`, or a scenario renamed on
 * one side only all leave a Rule that reads as verified and is not. This
 * module joins Jest's JSON results to the feature files and reports each
 * scenario as passed, failed or not executed, which is what the JUnit report
 * and the job summary show and what the execution check fails on.
 *
 * Scenarios are named by `tests/bdd/support/outline.ts`, the outline the
 * binder names its tests from, and a feature's test files come from the same
 * binding rules `spec:audit` enforces (`featureBindings`).
 *
 * Pure apart from reading feature files, so the unit suite imports it.
 */
import { readFileSync } from 'fs';
import * as path from 'path';

import { outlineFeature } from '../tests/bdd/support/outline';

// ---------------------------------------------------------------------------
// Jest's JSON results (`jest --json`), as much as the report reads
// ---------------------------------------------------------------------------

export interface JestAssertion {
  ancestorTitles: string[];
  title: string;
  /** passed, failed, pending (skipped), todo, disabled, focused */
  status: string;
  duration?: number | null;
  failureMessages?: string[];
}

export interface JestFileResult {
  /** The test file's path: absolute from Jest, or relative to the root. */
  name: string;
  status: string;
  message?: string;
  assertionResults: JestAssertion[];
}

export interface JestResults {
  testResults: JestFileResult[];
}

// ---------------------------------------------------------------------------
// The ledger
// ---------------------------------------------------------------------------

export type ScenarioStatus = 'passed' | 'failed' | 'not-executed';

export interface ScenarioCase {
  /** Repository-relative feature path, forward slashes. */
  file: string;
  feature: string;
  /** Null only for a scenario outside any Rule, which spec:audit rejects. */
  rule: string | null;
  scenario: string;
  line: number;
  status: ScenarioStatus;
  /** Seconds. */
  time: number;
  /** Why it failed, or why it did not run. */
  detail: string;
}

export type LedgerCheck = 'feature-not-run' | 'scenario-not-executed';

export interface LedgerFinding {
  check: LedgerCheck;
  file: string;
  line: number;
  message: string;
}

export interface Ledger {
  cases: ScenarioCase[];
  findings: LedgerFinding[];
  features: number;
  rules: number;
}

export interface FeatureSource {
  /** Repository-relative, forward slashes. */
  file: string;
  source: string;
}

const EXECUTED = new Set(['passed', 'failed']);

function toPosix(p: string): string {
  return p.split(path.sep).join('/').replace(/\\/g, '/');
}

// Built from code points so the source holds no control characters.
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

export function stripAnsi(text: string): string {
  return text.replace(ANSI, '');
}

function firstLine(text: string): string {
  return (
    stripAnsi(text)
      .split(/\r?\n/)
      .map((l) => l.trim())
      // Jest heads a suite that failed to load with this line; the cause follows.
      .find((l) => l.length > 0 && l !== '● Test suite failed to run') ?? ''
  );
}

/**
 * Join a run's results to the features. `bindings` maps each feature to the
 * test files that run it; a feature with none, or whose test files are absent
 * from the run or failed to load, did not run at all.
 */
export function buildLedger(
  root: string,
  features: readonly FeatureSource[],
  bindings: ReadonlyMap<string, readonly string[]>,
  results: JestResults,
): Ledger {
  const byFile = new Map<string, JestFileResult>();
  for (const result of results.testResults) {
    byFile.set(
      toPosix(path.relative(root, path.resolve(root, result.name))),
      result,
    );
  }

  const ledger: Ledger = { cases: [], findings: [], features: 0, rules: 0 };

  for (const { file, source } of features) {
    const outline = outlineFeature(source);
    ledger.features += 1;
    ledger.rules += outline.rules.filter((r) => r.title !== null).length;

    const testFiles = bindings.get(file) ?? [];
    const ran = testFiles
      .map((testFile) => ({ testFile, result: byFile.get(testFile) }))
      .filter(
        (r): r is { testFile: string; result: JestFileResult } =>
          r.result !== undefined,
      );
    const loaded = ran.filter(
      ({ result }) =>
        !(result.status === 'failed' && result.assertionResults.length === 0),
    );

    let notRun: string | null = null;
    if (testFiles.length === 0) {
      notRun =
        'no spec entry or legacy step file binds this feature (npm run spec:audit reports it as feature-unbound)';
    } else if (ran.length === 0) {
      notRun = `${testFiles.join(' and ')} did not run: it is missing from the Jest results. Check the file is matched by testMatch in jest.unit.config.cjs and that the report reads the results of the full npm run bdd`;
    } else if (loaded.length === 0) {
      notRun = `${ran.map((r) => r.testFile).join(' and ')} failed to load: ${firstLine(ran[0]?.result.message ?? '') || 'no message'}`;
    }

    // Each executed test counts once, so two scenarios with one title need two tests.
    const pool = loaded.flatMap(({ result }) => result.assertionResults);
    const used = new Set<JestAssertion>();
    const take = (title: string, statuses: (s: string) => boolean) => {
      const found = pool.find(
        (a) =>
          !used.has(a) &&
          statuses(a.status) &&
          a.title.toLowerCase() === title.toLowerCase(),
      );
      if (found) used.add(found);
      return found;
    };

    let firstNotRunLine: number | null = null;
    let notRunCount = 0;

    for (const rule of outline.rules) {
      for (const scenario of rule.scenarios) {
        const base = {
          file,
          feature: outline.title,
          rule: rule.title,
          scenario: scenario.title,
          line: scenario.line,
        };
        const executed = notRun
          ? undefined
          : take(scenario.title, (s) => EXECUTED.has(s));

        if (executed) {
          const messages = (executed.failureMessages ?? []).map(stripAnsi);
          ledger.cases.push({
            ...base,
            status: executed.status === 'passed' ? 'passed' : 'failed',
            time: (executed.duration ?? 0) / 1000,
            detail: messages.join('\n\n'),
          });
          continue;
        }

        let detail: string;
        if (notRun) {
          detail = `Not executed: ${notRun}.`;
          notRunCount += 1;
          firstNotRunLine ??= scenario.line;
        } else {
          const skipped = take(scenario.title, (s) => !EXECUTED.has(s));
          detail = skipped
            ? `Not executed: the test for this scenario was ${skipped.status} in ${loaded.map((r) => r.testFile).join(' and ')}. Remove the skip, .todo or pending() so the scenario runs.`
            : `Not executed: no test named "${scenario.title}" ran in ${loaded.map((r) => r.testFile).join(' and ')}. A legacy step file names its test('…') after the scenario exactly; rename one side to match.`;
          ledger.findings.push({
            check: 'scenario-not-executed',
            file,
            line: scenario.line,
            message: `Scenario '${scenario.title}' under Rule '${rule.title ?? '(none)'}'. ${detail}`,
          });
        }
        ledger.cases.push({ ...base, status: 'not-executed', time: 0, detail });
      }
    }

    if (notRun && notRunCount > 0) {
      ledger.findings.push({
        check: 'feature-not-run',
        file,
        line: firstNotRunLine ?? 1,
        message: `None of this feature's ${notRunCount} scenario(s) executed: ${notRun}.`,
      });
    }
  }

  return ledger;
}

/** Feature files under `root/tests/bdd/features`, sorted, read from disk. */
export function readFeatures(
  root: string,
  files: readonly string[],
): FeatureSource[] {
  return [...files].sort().map((file) => ({
    file,
    source: readFileSync(path.join(root, file), 'utf-8'),
  }));
}

// ---------------------------------------------------------------------------
// JUnit XML
// ---------------------------------------------------------------------------

export const SEPARATOR = ' › ';

/** The case name a report shows: the Feature, the Rule it verifies, the Scenario. */
export function caseName(c: ScenarioCase): string {
  return [c.feature, c.rule ?? '(no Rule)', c.scenario].join(SEPARATOR);
}

// XML 1.0 cannot represent C0 control characters other than tab, LF and CR.
// Built from code points so the source holds no control characters.
const XML_INVALID = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(8)}${String.fromCharCode(11)}${String.fromCharCode(12)}${String.fromCharCode(14)}-${String.fromCharCode(31)}]`,
  'g',
);

function xml(text: string): string {
  return text
    .replace(XML_INVALID, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function seconds(n: number): string {
  return n.toFixed(3);
}

export function toJUnit(ledger: Ledger): string {
  const suites = new Map<string, ScenarioCase[]>();
  for (const c of ledger.cases) {
    suites.set(c.file, [...(suites.get(c.file) ?? []), c]);
  }

  const count = (cases: ScenarioCase[], status: ScenarioStatus) =>
    cases.filter((c) => c.status === status).length;
  const time = (cases: ScenarioCase[]) => cases.reduce((n, c) => n + c.time, 0);

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuites name="BDD specification" tests="${ledger.cases.length}" failures="${count(ledger.cases, 'failed')}" errors="${count(ledger.cases, 'not-executed')}" skipped="0" time="${seconds(time(ledger.cases))}">`,
  ];

  for (const [file, cases] of suites) {
    const feature = cases[0]?.feature ?? file;
    lines.push(
      `  <testsuite name="${xml(feature)}" file="${xml(file)}" tests="${cases.length}" failures="${count(cases, 'failed')}" errors="${count(cases, 'not-executed')}" skipped="0" time="${seconds(time(cases))}">`,
    );
    for (const c of cases) {
      const classname = [c.feature, c.rule ?? '(no Rule)'].join(SEPARATOR);
      const open = `    <testcase classname="${xml(classname)}" name="${xml(caseName(c))}" file="${xml(file)}" line="${c.line}" time="${seconds(c.time)}"`;
      if (c.status === 'passed') {
        lines.push(`${open} />`);
      } else if (c.status === 'failed') {
        lines.push(
          `${open}>`,
          `      <failure message="${xml(firstLine(c.detail))}" type="ScenarioFailed">${xml(c.detail)}</failure>`,
          '    </testcase>',
        );
      } else {
        lines.push(
          `${open}>`,
          `      <error message="${xml(firstLine(c.detail))}" type="ScenarioNotExecuted">${xml(c.detail)}</error>`,
          '    </testcase>',
        );
      }
    }
    lines.push('  </testsuite>');
  }

  lines.push('</testsuites>', '');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Job summary
// ---------------------------------------------------------------------------

/** Rows listed in the summary; the JUnit artifact carries every case. */
export const SUMMARY_ROWS = 50;

/**
 * Text safe inside a Markdown table cell. Backslashes are escaped first, so a
 * title ending in `\` cannot turn the escaped pipe after it into a column break.
 */
export function cell(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ');
}

export function toSummary(ledger: Ledger): string {
  const count = (status: ScenarioStatus) =>
    ledger.cases.filter((c) => c.status === status).length;
  const broken = ledger.cases.filter((c) => c.status !== 'passed');

  const lines = [
    '## BDD specification',
    '',
    '| Features | Rules | Scenarios | Passed | Failed | Not executed |',
    '| -------: | ----: | --------: | -----: | -----: | -----------: |',
    `| ${ledger.features} | ${ledger.rules} | ${ledger.cases.length} | ${count('passed')} | ${count('failed')} | ${count('not-executed')} |`,
    '',
  ];

  if (broken.length === 0) {
    lines.push('Every scenario ran and passed.', '');
    return lines.join('\n');
  }

  lines.push(
    '### Rules not verified',
    '',
    '| Rule | Scenario | Result | Where |',
    '| ---- | -------- | ------ | ----- |',
  );
  for (const c of broken.slice(0, SUMMARY_ROWS)) {
    lines.push(
      `| ${cell(c.rule ?? '(no Rule)')} | ${cell(c.scenario)} | ${c.status === 'failed' ? 'failed' : 'not executed'} | \`${c.file}:${c.line}\` |`,
    );
  }
  if (broken.length > SUMMARY_ROWS) {
    lines.push(
      '',
      `…and ${broken.length - SUMMARY_ROWS} more. The \`bdd-junit\` artifact lists every case.`,
    );
  }
  lines.push('');
  return lines.join('\n');
}
