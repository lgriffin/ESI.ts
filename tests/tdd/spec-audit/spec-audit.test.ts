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
 *
 * The unit matrix runs this suite on every supported Node, so it is also what
 * proves the audit starts on each of them: the CLI loads its ESM dependencies
 * through a real dynamic `import()` rather than relying on `require(esm)`.
 */
import { execFileSync } from 'child_process';
import { readdirSync } from 'fs';
import * as path from 'path';

import {
  checkBugTags,
  checkExceptionList,
  loadBeadIds,
} from '../../../scripts/spec-audit-checks';

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

const output = runAudit(FIXTURES);

describe('spec-audit', () => {
  describe('the CLI', () => {
    it('starts and audits every fixture on this Node version', () => {
      const fixtureCount = readdirSync(path.join(REPO_ROOT, FIXTURES)).filter(
        (name) => name.endsWith('.feature'),
      ).length;

      expect(output).toContain('--- Summary ---');
      expect(output).toContain(`Files audited:  ${fixtureCount}`);
    });

    it('parses every fixture', () => {
      expect(output).not.toContain('Failed to parse Gherkin');
    });
  });

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
      ['bug with no tracker tag', 'Tagged @bug with no tracker tag'],
      [
        'bug linked to a bead the export does not contain',
        'Tag @esi-zzzz.999 names no bead in .beads/issues.jsonl',
      ],
    ];

    it.each(cases)('rejects a %s', (_name, expected) => {
      expect(output).toContain(expected);
    });

    it('fails the run rather than only reporting', () => {
      expect(output).toContain('FAIL:');
    });
  });

  describe('the compliant fixture', () => {
    it('produces no findings', () => {
      expect(output).not.toContain('compliant.feature');
    });
  });

  describe('bug tags', () => {
    const beads = new Set(['esi-23g.11']);

    it('accepts @bug beside a bead the export contains', () => {
      expect(checkBugTags(['@bug', '@esi-23g.11'], [], beads)).toEqual([]);
    });

    it('accepts @bug beside a GitHub issue', () => {
      expect(checkBugTags(['@bug', '@gh-332'], [], beads)).toEqual([]);
    });

    it('accepts @bug whose tracker tag is inherited from the Rule', () => {
      expect(checkBugTags(['@bug'], ['@esi-23g.11'], beads)).toEqual([]);
    });

    it('rejects @bug with no tracker on the element or an ancestor', () => {
      expect(checkBugTags(['@bug'], [], beads)).toHaveLength(1);
    });

    it.each(['@gh-0', '@gh-abc', '@ESI-23g', '@esi-', '@issue-12'])(
      'does not count %s as a tracker tag',
      (tag) => {
        expect(checkBugTags(['@bug', tag], [], beads)).toEqual([
          expect.stringContaining('Tagged @bug with no tracker tag'),
        ]);
      },
    );

    it('fails closed when the beads export cannot be read', () => {
      expect(checkBugTags(['@bug', '@esi-23g.11'], [], null)).toEqual([
        expect.stringContaining('could not be read'),
      ]);
    });

    it('reads bead ids from the committed export', () => {
      const ids = loadBeadIds();

      expect(ids).not.toBeNull();
      expect(ids!.size).toBeGreaterThan(0);
      expect([...ids!].every((id) => id.startsWith('esi-'))).toBe(true);
    });

    it('returns null for a missing export', () => {
      expect(
        loadBeadIds(path.join(REPO_ROOT, 'no-such-export.jsonl')),
      ).toBeNull();
    });
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
