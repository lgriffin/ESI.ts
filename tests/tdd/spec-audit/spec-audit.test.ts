/**
 * Self-tests for the EARS/Gherkin specification audit.
 *
 * The audit is a quality gate, and a gate with holes is worse than no gate
 * because it manufactures confidence. Every check therefore owns a negative
 * fixture that it must reject, plus one compliant fixture it must accept, so
 * a check that silently stops firing fails here first.
 */
import * as path from 'path';

import { auditFile, checkExceptionList } from '../../../scripts/spec-audit';

const FIXTURES = path.join(__dirname, 'fixtures');

function messagesFor(fixture: string): string[] {
  const abs = path.join(FIXTURES, fixture);
  const rel = `tests/tdd/spec-audit/fixtures/${fixture}`;
  return auditFile(abs, rel).findings.map((finding) => finding.message);
}

describe('spec-audit', () => {
  describe('every check rejects a negative fixture', () => {
    const cases: Array<[string, string, string]> = [
      [
        'Rule title that states no obligation',
        'rule-without-shall.feature',
        "must contain 'shall'",
      ],
      [
        'Rule title stating two requirements',
        'rule-with-two-shalls.feature',
        "2 occurrences of 'shall'",
      ],
      [
        'Rule title diluting the obligation keyword',
        'rule-wrong-obligation.feature',
        'non-standard obligation keyword(s): must',
      ],
      [
        'Rule title using unmeasurable language',
        'rule-vague-language.feature',
        "vague language: 'gracefully'",
      ],
      [
        'Rule title pointing at the system with a pronoun',
        'rule-pronoun-before-shall.feature',
        "Pronoun 'it' found before 'shall'",
      ],
      [
        'If pattern with no then',
        'rule-if-without-then.feature',
        "requires 'then' before 'shall'",
      ],
      [
        'If pattern with no comma before then',
        'rule-if-without-comma.feature',
        "requires a comma before 'then'",
      ],
      [
        'If pattern with an empty condition',
        'rule-if-empty-condition.feature',
        "requires a condition between 'If' and ', then'",
      ],
      [
        'When pattern with no comma after the trigger',
        'rule-when-without-comma.feature',
        "EARS 'When' clause should be followed by a comma",
      ],
      [
        'requirement buried in the rationale prose',
        'rule-requirement-in-description.feature',
        'Description contains 1 EARS requirement(s)',
      ],
      [
        'Rule with nothing verifying it',
        'rule-without-scenarios.feature',
        'No scenarios found under this rule',
      ],
      [
        'scenario with no requirement above it',
        'scenario-outside-rule.feature',
        'scenario(s) outside of any Rule block',
      ],
      [
        'Feature stating no requirement at all',
        'feature-without-rules.feature',
        'contains no Rule blocks',
      ],
      [
        'Feature with no description',
        'feature-without-description.feature',
        'has no description',
      ],
    ];

    it.each(cases)('rejects a %s', (_name, fixture, expected) => {
      expect(messagesFor(fixture).join('\n')).toContain(expected);
    });
  });

  it('reports nothing against a compliant feature', () => {
    expect(messagesFor('compliant.feature')).toEqual([]);
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
