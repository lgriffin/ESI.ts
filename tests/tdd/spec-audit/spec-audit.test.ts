/**
 * Self-tests for the EARS/Gherkin specification audit.
 *
 * The audit is a quality gate, and a gate with holes is worse than no gate
 * because it manufactures confidence. Every check therefore owns a negative
 * fixture that it must reject, plus one compliant fixture it must accept, so
 * a check that silently stops firing fails here first.
 *
 * The fixtures run through the real CLI in a child process rather than an
 * imported function: `spec-audit.ts` pulls in `@cucumber/gherkin`, which is
 * ESM-only and cannot be loaded by Jest's CommonJS runtime. Driving the
 * entry point also proves each check is wired into the run, not merely
 * present. The checks that need no Gherkin AST are imported directly.
 */
import { execFileSync } from 'child_process';
import * as path from 'path';

import { checkExceptionList } from '../../../scripts/spec-audit-checks';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const FIXTURES = 'tests/tdd/spec-audit/fixtures';

/** Findings go to stderr and the summary to stdout; a failing run exits 1. */
function runAudit(target: string): string {
  try {
    return execFileSync(
      process.execPath,
      ['-r', 'ts-node/register', 'scripts/spec-audit.ts', target],
      {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
        env: { ...process.env, TS_NODE_TRANSPILE_ONLY: 'true' },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string };
    return `${failure.stdout ?? ''}${failure.stderr ?? ''}`;
  }
}

describe('spec-audit', () => {
  let output = '';

  beforeAll(() => {
    output = runAudit(FIXTURES);
  }, 120_000);

  describe('every check rejects a negative fixture', () => {
    const cases: Array<[string, string]> = [
      ['Rule title that states no obligation', "must contain 'shall'"],
      ['Rule title stating two requirements', "2 occurrences of 'shall'"],
      [
        'Rule title diluting the obligation keyword',
        'non-standard obligation keyword(s): must',
      ],
      [
        'Rule title using unmeasurable language',
        "vague language: 'gracefully'",
      ],
      [
        'Rule title pointing at the system with a pronoun',
        "Pronoun 'it' found before 'shall'",
      ],
      ['If pattern with no then', "requires 'then' before 'shall'"],
      [
        'If pattern with no comma before then',
        "requires a comma before 'then'",
      ],
      [
        'If pattern with an empty condition',
        "requires a condition between 'If' and ', then'",
      ],
      [
        'When pattern with no comma after the trigger',
        "EARS 'When' clause should be followed by a comma",
      ],
      [
        'requirement buried in the rationale prose',
        'Description contains 1 EARS requirement(s)',
      ],
      ['Rule with nothing verifying it', 'No scenarios found under this rule'],
      [
        'scenario with no requirement above it',
        'scenario(s) outside of any Rule block',
      ],
      ['Feature stating no requirement at all', 'contains no Rule blocks'],
      ['Feature with no description', 'has no description'],
    ];

    it.each(cases)('rejects a %s', (_name, expected) => {
      expect(output).toContain(expected);
    });

    it('fails the run rather than only reporting', () => {
      expect(output).toContain('FAIL:');
    });
  });

  it('reports nothing against the compliant fixture', () => {
    expect(output).not.toContain('compliant.feature');
  });

  describe('exception list ratchet', () => {
    const existing = 'tests/bdd/features/core/0001-alliance.feature';

    it('accepts an entry that is in the baseline and still on disk', () => {
      expect(checkExceptionList([existing], new Set([existing]))).toEqual({
        added: [],
        dangling: [],
      });
    });

    it('rejects an entry that is absent from the baseline', () => {
      const { added } = checkExceptionList([existing], new Set());

      expect(added).toEqual([existing]);
    });

    it('rejects an entry whose feature file no longer exists', () => {
      const deleted = 'tests/bdd/features/core/9999-deleted.feature';
      const { dangling } = checkExceptionList([deleted], new Set([deleted]));

      expect(dangling).toEqual([deleted]);
    });

    it('rejects an entry that does not name a feature file', () => {
      const notAFeature = 'tests/bdd/features/core';
      const { dangling } = checkExceptionList(
        [notAFeature],
        new Set([notAFeature]),
      );

      expect(dangling).toEqual([notAFeature]);
    });
  });
});
