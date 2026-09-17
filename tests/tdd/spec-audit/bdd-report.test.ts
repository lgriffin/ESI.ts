/**
 * Self-tests for the BDD execution check and its JUnit report.
 *
 * Same contract as the audit's own suites: each check rejects a fixture built
 * to break only that check, and the compliant fixture produces no findings.
 * `report-fixtures/` is a miniature repository root holding one spec-bound
 * feature (with an outline) and one feature bound by a legacy step file; each
 * `results-*.json` is the Jest JSON a run of that tree might produce.
 */
import { execFileSync } from 'child_process';
import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';

import {
  JestResults,
  Ledger,
  LedgerCheck,
  buildLedger,
  caseName,
  readFeatures,
  toJUnit,
  toSummary,
} from '../../../scripts/bdd-report-core';
import { featureBindings } from '../../../scripts/spec-audit-steps';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const ROOT = path.join(__dirname, 'report-fixtures');
const ALPHA = 'tests/bdd/features/core/0001-alpha.feature';
const BETA = 'tests/bdd/features/core/0002-beta.feature';

function results(name: string): JestResults {
  return JSON.parse(
    readFileSync(path.join(ROOT, `results-${name}.json`), 'utf-8'),
  ) as JestResults;
}

function ledgerFor(run: JestResults, bindings = featureBindings(ROOT)): Ledger {
  return buildLedger(ROOT, readFeatures(ROOT, [ALPHA, BETA]), bindings, run);
}

function checks(ledger: Ledger): LedgerCheck[] {
  return [...new Set(ledger.findings.map((f) => f.check))].sort();
}

describe('bdd-report', () => {
  describe('the compliant fixture', () => {
    const ledger = ledgerFor(results('compliant'));

    it('produces no findings', () => {
      expect(ledger.findings).toEqual([]);
    });

    it('counts a failing scenario as executed, and names every case Feature › Rule › Scenario', () => {
      expect(ledger.cases.map((c) => [caseName(c), c.status])).toEqual([
        [
          'Alpha › When orders are requested, the Alpha client shall return every order. › Five orders are returned',
          'passed',
        ],
        [
          'Alpha › If ESI answers with a server error, then the Alpha client shall retry the request. › HTTP 502 is retried',
          'failed',
        ],
        [
          'Alpha › If ESI answers with a server error, then the Alpha client shall retry the request. › HTTP 503 is retried',
          'passed',
        ],
        [
          'Beta › When a status is requested, the Beta client shall return the status. › Status is returned',
          'passed',
        ],
        [
          'Beta › When a status is requested, the Beta client shall return the status. › Status is returned twice',
          'passed',
        ],
      ]);
      expect(ledger.features).toBe(2);
      expect(ledger.rules).toBe(3);
    });

    it('accepts the absolute test paths Jest writes', () => {
      const run = results('compliant');
      for (const file of run.testResults) {
        file.name = path.join(ROOT, file.name);
      }
      expect(ledgerFor(run).findings).toEqual([]);
    });
  });

  describe('every check rejects a negative fixture', () => {
    it('scenario-not-executed: a skipped test and a renamed test', () => {
      const ledger = ledgerFor(results('scenario-not-executed'));

      expect(checks(ledger)).toEqual(['scenario-not-executed']);
      expect(ledger.findings.map((f) => `${f.file}:${f.line}`)).toEqual([
        `${ALPHA}:15`,
        `${BETA}:12`,
      ]);
      expect(ledger.findings[0]!.message).toContain('was pending');
      expect(ledger.findings[1]!.message).toContain(
        'no test named "Status is returned twice" ran',
      );
    });

    it('feature-not-run: a test file missing from the run and one that failed to load', () => {
      const ledger = ledgerFor(results('feature-not-run'));

      expect(checks(ledger)).toEqual(['feature-not-run']);
      expect(ledger.findings.map((f) => f.message)).toEqual([
        expect.stringContaining(
          'tests/bdd/specs/core/0001-alpha.spec.ts did not run',
        ),
        expect.stringContaining(
          "failed to load: Cannot find module '../../support/beta'",
        ),
      ]);
      expect(ledger.cases.every((c) => c.status === 'not-executed')).toBe(true);
    });

    it('feature-not-run: a feature no test file binds', () => {
      const bindings = featureBindings(ROOT);
      bindings.delete(BETA);
      const ledger = ledgerFor(results('compliant'), bindings);

      expect(checks(ledger)).toEqual(['feature-not-run']);
      expect(ledger.findings[0]!.message).toContain(
        'no spec entry or legacy step file binds this feature',
      );
    });
  });

  describe('the JUnit report', () => {
    const junit = toJUnit(ledgerFor(results('scenario-not-executed')));

    it('names each test case Feature › Rule › Scenario, at the feature file and line', () => {
      expect(junit).toContain(
        '<testcase classname="Beta › When a status is requested, the Beta client shall return the status." ' +
          'name="Beta › When a status is requested, the Beta client shall return the status. › Status is returned" ' +
          `file="${BETA}" line="7"`,
      );
    });

    it('reports a failed scenario as a failure and an unexecuted one as an error', () => {
      expect(junit).toContain(
        '<testsuites name="BDD specification" tests="5" failures="1" errors="2"',
      );
      expect(junit).toContain(
        '<failure message="Error: expected 2 requests, received 1" type="ScenarioFailed">',
      );
      expect(junit).toContain('type="ScenarioNotExecuted"');
    });

    it('escapes XML metacharacters', () => {
      const ledger = ledgerFor(results('compliant'));
      ledger.cases[0]!.scenario = 'A <b> & "c"';
      expect(toJUnit(ledger)).toContain('A &lt;b&gt; &amp; &quot;c&quot;');
    });
  });

  describe('the job summary', () => {
    it('lists each Rule not verified with its location', () => {
      const summary = toSummary(ledgerFor(results('scenario-not-executed')));

      expect(summary).toContain('| 2 | 3 | 5 | 2 | 1 | 2 |');
      expect(summary).toContain(
        '| If ESI answers with a server error, then the Alpha client shall retry the request. | HTTP 502 is retried | failed | `tests/bdd/features/core/0001-alpha.feature:15` |',
      );
    });

    it('says so when every Rule is verified', () => {
      const ledger = ledgerFor(results('compliant'));
      ledger.cases = ledger.cases.filter((c) => c.status === 'passed');
      expect(toSummary(ledger)).toContain('Every scenario ran and passed');
    });
  });

  describe('the CLI', () => {
    function run(fixture: string): { output: string; status: number } {
      const dir = mkdtempSync(path.join(tmpdir(), 'bdd-report-'));
      try {
        const stdout = execFileSync(
          process.execPath,
          [
            '-r',
            'ts-node/register',
            'scripts/bdd-report.ts',
            `--root=${ROOT}`,
            `--results=results-${fixture}.json`,
            `--junit=${path.join(dir, 'junit.xml')}`,
            `--summary=${path.join(dir, 'summary.md')}`,
          ],
          {
            cwd: REPO_ROOT,
            encoding: 'utf-8',
            env: {
              ...process.env,
              TS_NODE_TRANSPILE_ONLY: 'true',
              GITHUB_ACTIONS: '',
            },
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        );
        return { output: stdout, status: 0 };
      } catch (error) {
        const failure = error as {
          stdout?: string;
          stderr?: string;
          status?: number;
        };
        return {
          output: `${failure.stdout ?? ''}${failure.stderr ?? ''}`,
          status: failure.status ?? -1,
        };
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }

    it('passes a run in which every scenario executed', () => {
      const { output, status } = run('compliant');
      expect(output).toContain('PASS');
      expect(status).toBe(0);
    });

    it('fails a run in which a scenario did not execute, naming file and line', () => {
      const { output, status } = run('scenario-not-executed');
      expect(output).toContain(`${BETA}:12 (scenario-not-executed)`);
      expect(status).toBe(1);
    });

    it('fails closed when there are no results to read', () => {
      const { output, status } = run('absent');
      expect(output).toContain('does not exist');
      expect(status).toBe(1);
    });
  });
});
