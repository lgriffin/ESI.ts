/**
 * Self-tests for the EARS requirement report (`npm run ears`).
 *
 * The report rolls the BDD ledger up from scenarios to Rules. Each case here
 * builds a ledger by hand so one verdict, pattern or feedback line changes at
 * a time.
 */
import type { ScenarioCase } from '../../../scripts/quality/bdd-report-core';
import {
  OutlineSummary,
  buildReport,
  classifyEars,
  failureReason,
  isExclusion,
  reportFails,
  toConsole,
  toMarkdown,
} from '../../../scripts/quality/ears-core';

const FILE = 'tests/bdd/features/core/0001-alpha.feature';
const OTHER = 'tests/bdd/features/core/0002-beta.feature';

const WHEN = 'When a request succeeds, the client shall return the body';
const IF = 'If the server returns 503, then the client shall retry the request';
const NOT =
  'If the server returns 404, then the circuit breaker shall not count the response';

function scenario(
  rule: string,
  title: string,
  status: ScenarioCase['status'],
  file = FILE,
  detail = '',
): ScenarioCase {
  return {
    file,
    feature: file === FILE ? 'Alpha' : 'Beta',
    rule,
    scenario: title,
    line: 10,
    status,
    time: 0,
    detail,
  };
}

function outline(rules: Array<[string, number]>, file = FILE): OutlineSummary {
  return {
    file,
    feature: file === FILE ? 'Alpha' : 'Beta',
    rules: rules.map(([title, scenarios], i) => ({
      title,
      line: 3 + i * 10,
      scenarios,
    })),
  };
}

describe('EARS requirement report', () => {
  describe('classifyEars', () => {
    it.each([
      ['The client shall expose a version', 'ubiquitous'],
      [WHEN, 'event-driven'],
      ['While offline, the client shall queue requests', 'state-driven'],
      [IF, 'unwanted-behaviour'],
      [
        'Where caching is enabled, the client shall reuse ETags',
        'optional-feature',
      ],
      [
        'While offline, when a request fails, the client shall queue it',
        'complex',
      ],
    ])('classifies "%s" as %s', (text, pattern) => {
      expect(classifyEars(text)).toBe(pattern);
    });

    it('does not treat a later "when" inside the response as a second clause', () => {
      expect(
        classifyEars('The client shall retry when asked, and only then'),
      ).toBe('ubiquitous');
    });
  });

  describe('isExclusion', () => {
    it.each([
      [NOT, true],
      ['If a header is absent, then the client shall  not send it', true],
      [
        'If an authenticated request is answered with HTTP 403, then the client shall not retry it',
        true,
      ],
      [IF, false],
      ['The client shall not log tokens', false],
      ['When asked, the client shall not retry', false],
      [
        'If the body is empty, then the client shall retry, and shall not log',
        false,
      ],
      ['If nothing is cached, then the client shall notify the caller', false],
    ])('isExclusion("%s") is %s', (text, expected) => {
      expect(isExclusion(text)).toBe(expected);
    });
  });

  describe('verdicts', () => {
    it('verifies a requirement whose every scenario passed', () => {
      const report = buildReport(
        [outline([[WHEN, 2]])],
        [scenario(WHEN, 'a', 'passed'), scenario(WHEN, 'b', 'passed')],
        'passed',
      );

      expect(report.requirements).toEqual([
        expect.objectContaining({
          id: '0001-alpha#R1',
          line: 3,
          verdict: 'verified',
          pattern: 'event-driven',
          scenarios: 2,
          passed: 2,
          failed: 0,
          notExecuted: 0,
          evidence: '',
        }),
      ]);
      expect(reportFails(report)).toBe(false);
    });

    it('fails a requirement when any scenario failed, citing the first failure', () => {
      const report = buildReport(
        [outline([[WHEN, 2]])],
        [
          scenario(WHEN, 'a', 'passed'),
          scenario(WHEN, 'b', 'failed', FILE, '\nexpected 200, got 500\nat x'),
        ],
        'passed',
      );

      const [req] = report.requirements;
      expect(req?.verdict).toBe('failing');
      expect(req?.failed).toBe(1);
      expect(req?.evidence).toBe(
        `Scenario 'b' (${FILE}:10) failed: expected 200, got 500`,
      );
      expect(reportFails(report)).toBe(true);
    });

    it('marks a requirement not run when a scenario did not execute', () => {
      const report = buildReport(
        [outline([[WHEN, 2]])],
        [
          scenario(WHEN, 'a', 'passed'),
          scenario(WHEN, 'b', 'not-executed', FILE, 'Not executed: skipped.'),
        ],
        'passed',
      );

      const [req] = report.requirements;
      expect(req?.verdict).toBe('unverified');
      expect(req?.notExecuted).toBe(1);
      expect(req?.evidence).toContain('Not executed: skipped.');
      expect(reportFails(report)).toBe(true);
    });

    it('prefers failing over not run when a Rule has both', () => {
      const report = buildReport(
        [outline([[WHEN, 2]])],
        [
          scenario(WHEN, 'a', 'not-executed'),
          scenario(WHEN, 'b', 'failed', FILE, 'boom'),
        ],
        'passed',
      );

      expect(report.requirements[0]?.verdict).toBe('failing');
    });

    it('assigns consecutive cases to Rules in outline order', () => {
      const report = buildReport(
        [
          outline([
            [WHEN, 1],
            [IF, 2],
          ]),
        ],
        [
          scenario(WHEN, 'a', 'passed'),
          scenario(IF, 'b', 'passed'),
          scenario(IF, 'c', 'failed', FILE, 'no retry'),
        ],
        'passed',
      );

      expect(
        report.requirements.map((r) => [r.id, r.verdict, r.scenarios]),
      ).toEqual([
        ['0001-alpha#R1', 'verified', 1],
        ['0001-alpha#R2', 'failing', 2],
      ]);
    });

    it('fails when the audit failed even though every requirement is verified', () => {
      const report = buildReport(
        [outline([[WHEN, 1]])],
        [scenario(WHEN, 'a', 'passed')],
        'failed',
      );

      expect(report.requirements[0]?.verdict).toBe('verified');
      expect(reportFails(report)).toBe(true);
    });

    it('says the audit failed, not that requirements are unverified, when only the audit failed', () => {
      const report = buildReport(
        [outline([[WHEN, 1]])],
        [scenario(WHEN, 'a', 'passed')],
        'failed',
      );

      expect(failureReason(report)).toBe(
        'the spec audit failed, so the requirements are not all well-formed EARS.',
      );
      expect(toMarkdown(report, 'now')).toContain(
        '**Result: FAIL.** the spec audit failed',
      );
    });

    it('does not claim well-formedness when the audit was skipped', () => {
      const report = buildReport(
        [outline([[WHEN, 1]])],
        [scenario(WHEN, 'a', 'passed')],
        'skipped',
      );

      expect(reportFails(report)).toBe(false);
      expect(toMarkdown(report, 'now')).toContain(
        'The spec audit was skipped, so well-formedness was not checked.',
      );
    });

    it('fails when there is no requirement to verify', () => {
      expect(reportFails(buildReport([], [], 'passed'))).toBe(true);
    });

    it('counts scenarios outside any Rule without making them requirements', () => {
      const report = buildReport(
        [
          {
            file: FILE,
            feature: 'Alpha',
            rules: [{ title: null, line: null, scenarios: 1 }],
          },
        ],
        [scenario('', 'loose', 'passed')],
        'passed',
      );

      expect(report.requirements).toHaveLength(0);
      expect(report.orphanCases).toBe(1);
    });
  });

  describe('exclusion register', () => {
    it('marks a negated unwanted-behaviour Rule as an exclusion and keeps its scenario names', () => {
      const report = buildReport(
        [
          outline([
            [IF, 1],
            [NOT, 2],
          ]),
        ],
        [
          scenario(IF, 'retries', 'passed'),
          scenario(NOT, 'a 404', 'passed'),
          scenario(NOT, 'a 403', 'failed'),
        ],
        'passed',
      );

      expect(report.requirements.map((r) => r.exclusion)).toEqual([
        false,
        true,
      ]);
      expect(report.requirements[1]).toMatchObject({
        id: '0001-alpha#R2',
        verdict: 'failing',
        scenarioNames: ['a 404', 'a 403'],
      });
      expect(report.requirements[0]?.scenarioNames).toEqual(['retries']);
    });
  });

  describe('feedback', () => {
    it('lists features that state no unwanted behaviour', () => {
      const report = buildReport(
        [outline([[WHEN, 1]]), outline([[IF, 1]], OTHER)],
        [scenario(WHEN, 'a', 'passed'), scenario(IF, 'b', 'passed', OTHER)],
        'passed',
      );

      expect(report.noUnwantedBehaviour).toEqual([
        { file: FILE, feature: 'Alpha' },
      ]);
    });
  });

  describe('output', () => {
    const report = buildReport(
      [
        outline([
          [WHEN, 1],
          [IF, 1],
        ]),
      ],
      [
        scenario(WHEN, 'a', 'passed'),
        scenario(IF, 'b', 'failed', FILE, 'no | retry'),
      ],
      'passed',
    );

    it('prints totals and each requirement not verified to the console', () => {
      const text = toConsole(report);

      expect(text).toContain('Requirements:              2 across 1 features');
      expect(text).toContain('  verified:                1');
      expect(text).toContain('  failing:                 1');
      expect(text).toContain(`[FAIL] 0001-alpha#R2  ${FILE}:13`);
      expect(text).toContain(IF);
      expect(text).not.toContain(`[PASS]`);
      expect(text).toContain('FAIL: 1 requirement(s) are not verified.');
    });

    it('writes a Markdown report with verdicts, feedback and every requirement', () => {
      const md = toMarkdown(report, '2026-09-27T00:00:00.000Z');

      expect(md).toContain('| passed | 2 | 1 | 1 | 0 |');
      expect(md).toContain('**Result: FAIL.**');
      expect(md).toContain('## Requirements not verified');
      expect(md).toContain('no \\| retry');
      expect(md).toContain('| event-driven | 1 |');
      expect(md).toContain('| unwanted-behaviour | 1 |');
      expect(md).toContain('- 2 of 2 requirements rest on a single scenario.');
      expect(md).toContain(
        '`tests/bdd/features/core/0001-alpha.feature` · 1/2 verified',
      );
      expect(md).toContain(
        `| \`0001-alpha#R1\` | PASS | event-driven | 1/1 | ${WHEN} |`,
      );
    });

    it('lists the exclusion register with each exclusion, its verdict and its scenarios', () => {
      const withExclusion = buildReport(
        [
          outline([
            [WHEN, 1],
            [NOT, 2],
          ]),
        ],
        [
          scenario(WHEN, 'a', 'passed'),
          scenario(NOT, 'a 404 | plain', 'passed'),
          scenario(NOT, 'a 403', 'passed'),
        ],
        'passed',
      );
      const md = toMarkdown(withExclusion, '2026-09-27T00:00:00.000Z');
      const [before, register] = md.split('## Exclusion register');
      const [table, after] = register!.split(
        '## Feedback on the specification',
      );

      expect(before).toContain('**Result: PASS.**');
      expect(table).toContain(
        `| \`0001-alpha#R2\` | PASS | ${NOT} | a 404 \\| plain; a 403 |`,
      );
      expect(table).not.toContain(WHEN);
      expect(after).toContain('## Every requirement');
      expect(toConsole(withExclusion)).toContain(
        'Exclusions (shall not):    1',
      );
    });

    it('says when no requirement states an exclusion', () => {
      const md = toMarkdown(report, '2026-09-27T00:00:00.000Z');

      expect(md).toContain('## Exclusion register');
      expect(md).toContain('No requirement in this run states an exclusion.');
      expect(toConsole(report)).toContain('Exclusions (shall not):    0');
    });

    it('says PASS when every requirement is verified', () => {
      const clean = buildReport(
        [outline([[IF, 1]])],
        [scenario(IF, 'a', 'passed')],
        'passed',
      );

      expect(toConsole(clean)).toContain(
        'PASS: all 1 EARS requirements are verified.',
      );
      expect(toMarkdown(clean, 'now')).toContain('**Result: PASS.**');
      expect(toMarkdown(clean, 'now')).not.toContain(
        '## Requirements not verified',
      );
    });
  });
});
