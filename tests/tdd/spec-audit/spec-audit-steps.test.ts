/**
 * Self-tests for the step-file half of the spec audit.
 *
 * Same contract as `spec-audit.test.ts`: every check rejects a fixture built
 * to break only that check, and the compliant fixture produces no findings.
 * Each fixture under `step-fixtures/` is a miniature repository root holding
 * just the `tests/bdd` files the case needs.
 */
import { execFileSync } from 'child_process';
import * as path from 'path';

import {
  LegacyStepFiles,
  StepCheck,
  auditStepLayout,
  normaliseStepText,
  stepFileName,
} from '../../../scripts/spec-audit-steps';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const FIXTURES = path.join(__dirname, 'step-fixtures');
const BETA_LEGACY = 'tests/bdd/step-definitions/core/beta.steps.ts';

const NO_LEGACY: LegacyStepFiles = { listed: [], baseline: new Set() };
const BETA_LISTED: LegacyStepFiles = {
  listed: [BETA_LEGACY],
  baseline: new Set([BETA_LEGACY]),
};

function checksFor(fixture: string, legacy: LegacyStepFiles): StepCheck[] {
  const findings = auditStepLayout(path.join(FIXTURES, fixture), legacy);
  return [...new Set(findings.map((f) => f.check))].sort();
}

describe('spec-audit step files', () => {
  describe('the compliant fixture', () => {
    it('produces no findings', () => {
      expect(
        auditStepLayout(path.join(FIXTURES, 'compliant'), BETA_LISTED),
      ).toEqual([]);
    });
  });

  describe('every check rejects a negative fixture', () => {
    it.each<[StepCheck, LegacyStepFiles]>([
      ['step-file-location', NO_LEGACY],
      ['step-file-count', NO_LEGACY],
      ['step-file-keyword', NO_LEGACY],
      ['step-file-pattern', NO_LEGACY],
      ['step-file-name', NO_LEGACY],
      ['step-near-duplicate', NO_LEGACY],
      ['feature-unbound', NO_LEGACY],
      ['feature-bound-twice', BETA_LISTED],
      ['spec-without-feature', NO_LEGACY],
      ['legacy-step-file-unlisted', NO_LEGACY],
    ])('%s', (check, legacy) => {
      expect(checksFor(check, legacy)).toEqual([check]);
    });

    it('legacy-step-file-dangling', () => {
      const gone = 'tests/bdd/step-definitions/core/gone.steps.ts';
      expect(
        checksFor('compliant', {
          listed: [BETA_LEGACY, gone],
          baseline: new Set([BETA_LEGACY, gone]),
        }),
      ).toEqual(['legacy-step-file-dangling']);
    });

    it('legacy-step-file-added', () => {
      expect(
        checksFor('compliant', { listed: [BETA_LEGACY], baseline: new Set() }),
      ).toEqual(['legacy-step-file-added']);
    });
  });

  describe('the legacy list baseline', () => {
    it('skips the added check only while the integration branch has no list', () => {
      expect(
        checksFor('compliant', { listed: [BETA_LEGACY], baseline: null }),
      ).toEqual([]);
    });
  });

  describe('step file names', () => {
    it.each([
      [{ kind: 'string', text: 'a valid region ID' }, 'a-valid-region-id'],
      [
        { kind: 'string', text: 'a region with {int} orders' },
        'a-region-with-int-orders',
      ],
      [{ kind: 'string', text: "the client's tokens" }, 'the-client-s-tokens'],
      [
        { kind: 'regexp', text: '^order (\\d+) is returned$' },
        'order-is-returned',
      ],
    ] as const)('%j is named %s', (pattern, name) => {
      expect(stepFileName(pattern)).toBe(name);
    });

    it('cuts a long pattern at a word boundary', () => {
      const name = stepFileName({ kind: 'string', text: 'word '.repeat(40) });
      expect(name.length).toBeLessThanOrEqual(96);
      expect(name.endsWith('word')).toBe(true);
    });
  });

  describe('near-duplicate normalisation', () => {
    it('treats numbers and quoted strings as their parameter types', () => {
      expect(normaliseStepText('a region with 5 orders')).toBe(
        normaliseStepText('a region with {int} orders'),
      );
      expect(normaliseStepText('a status of "online"')).toBe(
        normaliseStepText('a status of {string}'),
      );
    });

    it('keeps steps with different words apart', () => {
      expect(normaliseStepText('a region with 5 orders')).not.toBe(
        normaliseStepText('a region with 5 contracts'),
      );
    });
  });

  describe('the CLI', () => {
    it('runs the step checks against --steps-root', () => {
      let output: string;
      try {
        output = execFileSync(
          process.execPath,
          [
            '-r',
            'ts-node/register',
            'scripts/spec-audit.ts',
            'tests/tdd/spec-audit/fixtures/compliant.feature',
            '--steps-root=tests/tdd/spec-audit/step-fixtures/step-file-count',
          ],
          {
            cwd: REPO_ROOT,
            encoding: 'utf-8',
            env: { ...process.env, TS_NODE_TRANSPILE_ONLY: 'true' },
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        );
      } catch (error) {
        const failure = error as { stdout?: string; stderr?: string };
        output = `${failure.stdout ?? ''}${failure.stderr ?? ''}`;
      }
      expect(output).toContain('(step-file-count)');
      expect(output).toContain('FAIL');
    });
  });
});
