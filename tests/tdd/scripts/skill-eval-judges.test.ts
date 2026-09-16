/**
 * Self-tests for the skill eval judges (R14).
 *
 * The judges gate every change to `.claude/skills/**`. A judge that stops
 * firing would pass any output, so each one is shown rejecting a bad input as
 * well as accepting a good one — including the real recorded outputs and the
 * real "before review" fixtures of the ears-gherkin-dev suite.
 */
import { readFileSync } from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

import {
  EvalManifest,
  NativeCase,
  NativeEvalResult,
  NativeRegexGrader,
  checkVersionBump,
  evaluateRegexGrader,
  gateNativeResult,
  judgeCaseOutputs,
  judgeNoClientSpy,
  judgeRuleShall,
  judgeScenariosNested,
  judgeStepBindings,
  judgeTransportSeam,
  outlineFeature,
  stepTestNames,
  validateManifest,
  validateNativeCase,
} from '../../../scripts/skill-eval-judges';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const EVAL_DIR = path.join(
  REPO_ROOT,
  '.claude',
  'skills',
  'ears-gherkin-dev',
  'eval',
);
const read = (...parts: string[]) =>
  readFileSync(path.join(EVAL_DIR, ...parts), 'utf-8');

const GOOD_FEATURE = `Feature: Status
  Describes the status client.

  Rule: When server status is requested, the Status client shall return the VIP flag.
    Rationale.

    Scenario: VIP flag is returned
      Given a status
      When requested
      Then the flag shall be present
`;

const GOOD_STEPS = `
test('VIP flag is returned', ({ given }) => {
  given('a status', () => {
    queueResponse({ status: 200, body: { vip: true } });
  });
});
`;

describe('skill-eval judges', () => {
  describe('outlineFeature', () => {
    it('ignores keywords inside comments and doc strings', () => {
      const text = [
        'Feature: F',
        '  # Scenario: commented out',
        '  """',
        '  Scenario: inside a doc string',
        '  """',
        '  Rule: The client shall work.',
        '    Scenario Outline: real one',
      ].join('\n');
      expect(outlineFeature(text).map((l) => l.keyword)).toEqual([
        'Feature',
        'Rule',
        'Scenario',
      ]);
    });
  });

  describe('judgeRuleShall', () => {
    it('accepts a Rule with exactly one shall', () => {
      expect(judgeRuleShall('f', GOOD_FEATURE)).toEqual([]);
    });

    it('rejects a Rule with two shalls', () => {
      const text = GOOD_FEATURE.replace(
        'shall return the VIP flag.',
        'shall return the VIP flag and shall reject a 503.',
      );
      const findings = judgeRuleShall('f', text);
      expect(findings).toHaveLength(1);
      expect(findings[0]!.line).toBe(4);
      expect(findings[0]!.message).toContain("2 'shall'");
    });

    it('rejects a Rule with no shall', () => {
      const text = GOOD_FEATURE.replace('shall return', 'returns');
      expect(judgeRuleShall('f', text)[0]!.message).toContain("0 'shall'");
    });

    it('rejects a feature with no Rule at all', () => {
      const findings = judgeRuleShall('f', 'Feature: F\n  Scenario: s\n');
      expect(findings[0]!.message).toContain('No `Rule:` block');
    });
  });

  describe('judgeScenariosNested', () => {
    it('accepts scenarios nested under a Rule', () => {
      expect(judgeScenariosNested('f', GOOD_FEATURE)).toEqual([]);
    });

    it('rejects a scenario at feature level', () => {
      const text = 'Feature: F\n  desc\n\n  Scenario: loose\n    Given x\n';
      const findings = judgeScenariosNested('f', text);
      expect(findings).toHaveLength(1);
      expect(findings[0]!.message).toContain('outside any Rule: loose');
    });

    it('rejects a Rule without scenarios', () => {
      const text = GOOD_FEATURE + '\n  Rule: The client shall log.\n';
      const findings = judgeScenariosNested('f', text);
      expect(findings.map((f) => f.message)).toEqual([
        'Rule has no scenarios: The client shall log.',
      ]);
    });
  });

  describe('judgeNoClientSpy', () => {
    it.each([
      "jest.spyOn(client.status, 'getStatus')",
      "spyOn( client.market, 'getMarketPrices')",
      "jest.spyOn(this.client.market, 'getMarketOrders')",
    ])('rejects %s', (line) => {
      const findings = judgeNoClientSpy('s', `a\n${line}\n`);
      expect(findings).toHaveLength(1);
      expect(findings[0]!.line).toBe(2);
    });

    it('accepts spies on things that are not the client', () => {
      expect(
        judgeNoClientSpy('s', "jest.spyOn(console, 'warn');\nclientId: 'x'"),
      ).toEqual([]);
    });
  });

  describe('judgeTransportSeam', () => {
    it.each([
      'queueResponse({ status: 200 })',
      'fetchMock.mockResponseOnce("[]")',
    ])('accepts %s', (text) => {
      expect(judgeTransportSeam('s', text)).toEqual([]);
    });

    it('rejects a step file that queues nothing', () => {
      expect(judgeTransportSeam('s', 'const x = 1;')).toHaveLength(1);
    });
  });

  describe('step bindings', () => {
    it('extracts test titles across quote styles and escapes', () => {
      const text = `test('it\\'s a', f); test("b", f); test(\`c\`, f);`;
      expect(stepTestNames(text)).toEqual(["it's a", 'b', 'c']);
    });

    it('accepts bindings that name produced scenarios', () => {
      expect(judgeStepBindings('s', GOOD_STEPS, [GOOD_FEATURE])).toEqual([]);
    });

    it('rejects a binding with no matching scenario', () => {
      const steps = GOOD_STEPS.replace('VIP flag is returned', 'Renamed');
      const findings = judgeStepBindings('s', steps, [GOOD_FEATURE]);
      expect(findings[0]!.message).toContain("test('Renamed')");
    });

    it('rejects a step file with no bindings', () => {
      expect(judgeStepBindings('s', '', [GOOD_FEATURE])).toHaveLength(1);
    });
  });

  describe('judgeCaseOutputs', () => {
    it('reports files the case did not produce', () => {
      const findings = judgeCaseOutputs({
        features: [{ path: 'out/a.feature', text: null }],
        steps: [{ path: 'out/a.steps.ts', text: null }],
      });
      expect(findings.map((f) => f.judge)).toEqual([
        'outputs-present',
        'outputs-present',
      ]);
    });

    it('passes a compliant feature and step file', () => {
      expect(
        judgeCaseOutputs({
          features: [{ path: 'f', text: GOOD_FEATURE }],
          steps: [{ path: 's', text: GOOD_STEPS }],
        }),
      ).toEqual([]);
    });
  });

  describe('evaluateRegexGrader', () => {
    const grader = (match: string): NativeRegexGrader => ({
      name: 'g',
      type: 'regex',
      pattern: 'shall',
      flags: 'i',
      match,
    });

    it.each([
      ['contains', 'a SHALL b', true],
      ['contains', 'nothing', false],
      ['not_contains', 'nothing', true],
      ['not_contains', 'shall', false],
      ['count:2', 'shall shall', true],
      ['count:2', 'shall', false],
      ['bogus', 'shall', false],
    ])('%s on %j passes=%s', (match, text, passed) => {
      expect(evaluateRegexGrader(grader(match), text).passed).toBe(passed);
    });
  });
});

describe('ears-gherkin-dev eval suite', () => {
  const manifest = yaml.load(read('eval.yaml')) as EvalManifest;

  it('has a valid manifest with at least three cases', () => {
    expect(validateManifest(manifest)).toEqual([]);
    expect(manifest.cases.length).toBeGreaterThanOrEqual(3);
  });

  describe.each(manifest.cases.map((c) => [c.name, c] as const))(
    'case %s',
    (_name, entry) => {
      const native = yaml.load(read(entry.dir, 'case.yaml')) as NativeCase;
      const fileGraders = (native.graders ?? []).filter(
        (g) => g.type === 'regex' && typeof g.target === 'object',
      ) as NativeRegexGrader[];
      const recorded = (rel: string) => read(entry.dir, 'recorded', rel);

      it('stays within the budget and carries both grader tiers', () => {
        expect(validateNativeCase(entry, native, manifest.budget)).toEqual([]);
      });

      it('has recorded outputs that pass every deterministic judge', () => {
        const findings = judgeCaseOutputs({
          features: entry.outputs.features.map((p) => ({
            path: p,
            text: recorded(p),
          })),
          steps: entry.outputs.steps.map((p) => ({
            path: p,
            text: recorded(p),
          })),
        });
        expect(findings).toEqual([]);
      });

      it.each(fileGraders.map((g) => [g.name, g] as const))(
        'native grader %s accepts the recorded output',
        (_g, g) => {
          const target = g.target as { path: string };
          expect(evaluateRegexGrader(g, recorded(target.path))).toMatchObject({
            passed: true,
          });
        },
      );
    },
  );

  it('rejects the pre-review fixtures of the review-feedback case', () => {
    const entry = manifest.cases.find((c) => c.name === 'review-feedback')!;
    const fixture = (f: string) => read(entry.dir, 'fixtures', f);
    const judges = judgeCaseOutputs({
      features: [{ path: 'f', text: fixture('0034-status.feature') }],
      steps: [{ path: 's', text: fixture('status.steps.ts') }],
    }).map((f) => f.judge);
    expect(judges).toEqual(
      expect.arrayContaining([
        'rule-one-shall',
        'no-client-spy',
        'transport-seam',
      ]),
    );

    const native = yaml.load(read(entry.dir, 'case.yaml')) as NativeCase;
    const verdict = (name: string, file: string) =>
      evaluateRegexGrader(
        native.graders!.find((g) => g.name === name) as NativeRegexGrader,
        fixture(file),
      ).passed;
    expect(verdict('rule-single-shall', '0034-status.feature')).toBe(false);
    expect(verdict('two-rules', '0034-status.feature')).toBe(false);
    expect(verdict('no-client-spy', 'status.steps.ts')).toBe(false);
    expect(verdict('transport-seam', 'status.steps.ts')).toBe(false);
  });

  it('native no-feature-level-scenario grader rejects a loose scenario', () => {
    const native = yaml.load(
      read('cases', 'new-endpoint', 'case.yaml'),
    ) as NativeCase;
    const g = native.graders!.find(
      (x) => x.name === 'no-feature-level-scenario',
    ) as NativeRegexGrader;
    const loose = 'Feature: F\n  desc\n\n  Scenario: loose\n\n  Rule: R\n';
    expect(evaluateRegexGrader(g, loose).passed).toBe(false);
    expect(evaluateRegexGrader(g, GOOD_FEATURE).passed).toBe(true);
  });
});

describe('validateManifest', () => {
  it('lists every structural problem', () => {
    const problems = validateManifest({
      schema_version: 2,
      skill: { name: '', version: 'one' },
      native: { runs: 0, ablation: 'sometimes' },
      thresholds: { case_score_min: 2, llm: {} },
      budget: { max_cost_usd: 0 },
      cases: [],
    });
    expect(problems).toEqual(
      expect.arrayContaining([
        'schema_version must be 1',
        'skill.version must be semver (x.y.z)',
        'native.ablation must be none or with-without',
        'thresholds.case_score_min must be in [0, 1]',
        'thresholds.llm.min_mean must be in [0, 1]',
        'budget.max_cost_usd must be a positive number',
        'cases must list at least one case',
      ]),
    );
  });

  it('rejects a non-object', () => {
    expect(validateManifest(null)).toEqual(['manifest is not an object']);
  });
});

describe('validateNativeCase', () => {
  const entry = {
    name: 'c',
    dir: 'cases/c',
    outputs: { features: ['f'], steps: [] },
  };
  const budget = {
    max_cost_usd: 5,
    max_turns_per_run: 20,
    max_timeout_seconds: 300,
  };

  it('rejects a case over the turn and timeout budget, without tiers', () => {
    const problems = validateNativeCase(
      entry,
      {
        name: 'other',
        execution: { max_turns: 50, timeout_seconds: 900 },
        graders: [],
      },
      budget,
    );
    expect(problems).toEqual([
      "case c: case.yaml name 'other' does not match the manifest",
      'case c: max_turns 50 exceeds budget.max_turns_per_run 20',
      'case c: timeout_seconds 900 exceeds budget.max_timeout_seconds 300',
      'case c: no llm grader',
      'case c: no deterministic grader',
    ]);
  });
});

describe('gateNativeResult', () => {
  const manifest = {
    thresholds: {
      case_score_min: 0.8,
      deterministic_pass_rate: 1,
      llm: { min_mean: 0.75 },
    },
    budget: { max_cost_usd: 5, max_turns_per_run: 40, max_timeout_seconds: 1 },
    cases: [{ name: 'c', dir: 'd', outputs: { features: ['f'], steps: [] } }],
  } as unknown as EvalManifest;

  const result = (
    over: Partial<NativeEvalResult> = {},
    verdicts: Array<[string, boolean]> = [
      ['regex-a', true],
      ['judge-a', true],
    ],
    score = 1,
  ): NativeEvalResult => ({
    costUsd: 1.25,
    partial: false,
    cases: [
      {
        name: 'c',
        graders: [
          { name: 'regex-a', type: 'regex' },
          { name: 'judge-a', type: 'llm' },
          { name: 'judge-b', type: 'llm' },
        ],
        arms: {
          with: [
            {
              error: null,
              graders: verdicts.map(([name, passed]) => ({ name, passed })),
            },
          ],
        },
        aggregates: { score },
      },
    ],
    ...over,
  });

  it('passes a run inside every threshold and the budget', () => {
    const gate = gateNativeResult({
      result: result(),
      manifest,
      workspaceRuns: [true],
    });
    expect(gate.failures).toEqual([]);
    expect(gate.passed).toBe(true);
    expect(gate.metrics).toMatchObject({
      costUsd: 1.25,
      llmMean: 1,
      deterministicPassRate: 1,
    });
  });

  it('fails a run over budget or cut short by the cost ceiling', () => {
    const gate = gateNativeResult({
      result: result({
        costUsd: 5.5,
        partial: true,
        partialReason: 'cost_ceiling',
      }),
      manifest,
      workspaceRuns: [true],
    });
    expect(gate.passed).toBe(false);
    expect(gate.failures.join('\n')).toMatch(/partial \(cost_ceiling\)/);
    expect(gate.failures.join('\n')).toMatch(/exceeds budget \$5\.00/);
  });

  it('fails when the llm mean is below min_mean', () => {
    const gate = gateNativeResult({
      result: result({}, [
        ['regex-a', true],
        ['judge-a', true],
        ['judge-b', false],
      ]),
      manifest,
      workspaceRuns: [true],
    });
    expect(gate.metrics.llmMean).toBeCloseTo(0.5);
    expect(gate.failures).toEqual(['llm grader mean 0.50 < min_mean 0.75']);
  });

  it('fails when a workspace judge or native deterministic grader fails', () => {
    const gate = gateNativeResult({
      result: result(),
      manifest,
      workspaceRuns: [false],
    });
    expect(gate.failures).toEqual(['deterministic pass rate 0.50 < 1']);
  });

  it('fails a low case score, an errored run, and a missing case', () => {
    const r = result({}, undefined, 0.5);
    r.cases[0]!.arms.with[0]!.error = 'timed out after 600s';
    const gate = gateNativeResult({
      result: r,
      manifest: {
        ...manifest,
        cases: [
          ...manifest.cases,
          { name: 'gone', dir: 'x', outputs: { features: ['f'], steps: [] } },
        ],
      },
      workspaceRuns: [true],
    });
    expect(gate.failures).toEqual([
      'case gone produced no result',
      'case c scored 0.50 < 0.8',
      'case c: a run errored: timed out after 600s',
    ]);
  });

  it('ignores unscored verdicts and fails when no llm verdict exists', () => {
    const r = result({}, [['regex-a', true]]);
    r.cases[0]!.arms.with[0]!.graders.push({
      name: 'judge-a',
      passed: false,
      scored: false,
    });
    const gate = gateNativeResult({
      result: r,
      manifest,
      workspaceRuns: [],
    });
    expect(gate.failures).toEqual(['no llm grader verdicts were recorded']);
  });
});

describe('checkVersionBump', () => {
  it('requires a bump when SKILL.md changed', () => {
    expect(
      checkVersionBump({
        skillChanged: true,
        baseVersion: '1.0.0',
        headVersion: '1.0.0',
      }),
    ).toHaveLength(1);
  });

  it.each([
    [false, '1.0.0', '1.0.0'],
    [true, '1.0.0', '1.1.0'],
    [true, null, '1.0.0'],
  ])(
    'passes when changed=%s base=%s head=%s',
    (skillChanged, baseVersion, headVersion) => {
      expect(
        checkVersionBump({ skillChanged, baseVersion, headVersion }),
      ).toEqual([]);
    },
  );
});
