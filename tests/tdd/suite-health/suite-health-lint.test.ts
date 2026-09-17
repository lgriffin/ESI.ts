import { readFileSync } from 'fs';
import path from 'path';
import { ESLint } from 'eslint';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const FIXTURES = path.join(__dirname, 'fixtures');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { config } = require('../../../eslint.suite-health.rules.cjs');

// The config the npm script uses, globs included, so a broken `files` or
// `ignores` entry fails here too. Each fixture is linted as if it lived at `as`.
const eslint = new ESLint({
  cwd: REPO_ROOT,
  overrideConfigFile: true,
  overrideConfig: config,
});

async function findings(fixture: string, as: string) {
  const [result] = await eslint.lintText(
    readFileSync(path.join(FIXTURES, fixture), 'utf-8'),
    { filePath: path.join(REPO_ROOT, as) },
  );
  return result!.messages.map((m) => m.ruleId ?? `fatal: ${m.message}`);
}

describe('suite-health lint (npm run lint:suite-health)', () => {
  it.each([
    [
      'focused-test.ts',
      'tests/tdd/core/Example.test.ts',
      'jest/no-focused-tests',
      3,
    ],
    [
      'focused-scenario.ts',
      'tests/bdd/step-definitions/core/example.steps.ts',
      'suite-health/no-focused-scenario',
      1,
    ],
    [
      'disabled-test.ts',
      'tests/tdd/core/Example.test.ts',
      'jest/no-disabled-tests',
      3,
    ],
    [
      'disabled-scenario.ts',
      'tests/bdd/step-definitions/core/example.steps.ts',
      'suite-health/no-disabled-scenario',
      3,
    ],
    [
      'no-assertion.ts',
      'tests/tdd/core/Example.test.ts',
      'jest/expect-expect',
      2,
    ],
    [
      'then-step-without-assertion.ts',
      'tests/bdd/steps/then/the-client-shall-return-current-status-information.ts',
      'jest/expect-expect',
      1,
    ],
    [
      'legacy-then-without-assertion.ts',
      'tests/bdd/step-definitions/core/example.steps.ts',
      'jest/expect-expect',
      1,
    ],
    [
      'swallowed-assertion.ts',
      'tests/integration/example.test.ts',
      'suite-health/no-swallowed-assertion',
      2,
    ],
    [
      'conditional-expect.ts',
      'tests/tdd/core/Example.test.ts',
      'jest/no-conditional-expect',
      3,
    ],
    [
      'jasmine-globals.ts',
      'tests/integration/example.test.ts',
      'jest/no-jasmine-globals',
      1,
    ],
    [
      'unawaited-async-expect.ts',
      'tests/tdd/core/Example.test.ts',
      'jest/valid-expect',
      2,
    ],
    [
      'unrestored-console-mock.ts',
      'tests/fuzz/example.test.ts',
      'suite-health/no-unrestored-console-mock',
      3,
    ],
  ])('%s is rejected when linted as %s', async (fixture, as, rule, count) => {
    expect(await findings(fixture, as)).toEqual(Array(count).fill(rule));
  });

  it.each([
    ['tests/tdd/core/Example.test.ts'],
    ['tests/bdd/step-definitions/core/example.steps.ts'],
  ])('the compliant fixture has no findings when linted as %s', async (as) => {
    expect(await findings('compliant.ts', as)).toEqual([]);
  });

  it('checks Then callbacks as tests only under tests/bdd', async () => {
    expect(
      await findings(
        'then-step-without-assertion.ts',
        'tests/tdd/bdd-binder/binder.test.ts',
      ),
    ).toEqual([]);
  });

  it('lints every tests/ tier but not the fixture trees', async () => {
    for (const file of [
      'tests/tdd/core/Example.test.ts',
      'tests/bdd/steps/then/example.ts',
      'tests/contract/example.test.ts',
      'tests/typetests/example.test-d.ts',
    ]) {
      expect(await eslint.isPathIgnored(path.join(REPO_ROOT, file))).toBe(
        false,
      );
    }
    expect(
      await eslint.isPathIgnored(path.join(FIXTURES, 'focused-test.ts')),
    ).toBe(true);
  });
});
