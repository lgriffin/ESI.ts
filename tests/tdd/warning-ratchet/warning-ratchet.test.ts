/**
 * Self-tests for the warning ratchet (npm run lint:ratchet).
 *
 * The counting and baseline rules are exercised on hand-built ESLint results,
 * so a change to how a message is classified (warning, error, parse failure,
 * unused directive) fails here rather than silently changing what CI gates.
 */
import { ESLint, Linter } from 'eslint';

import {
  UNUSED_DIRECTIVE,
  applyRatchet,
  collectWarnings,
  countWarnings,
  integrityProblems,
  lowerBaseline,
  parseBaseline,
  ratchetProblems,
  serializeBaseline,
  totalsByRule,
  updateProblems,
} from '../../../scripts/quality/warning-ratchet-core';

const ROOT = '/repo';

function message(
  overrides: Partial<Linter.LintMessage> = {},
): Linter.LintMessage {
  return {
    ruleId: 'sonarjs/no-dead-store',
    severity: 1,
    message: 'unused',
    line: 1,
    column: 1,
    ...overrides,
  } as Linter.LintMessage;
}

function result(
  file: string,
  messages: Linter.LintMessage[],
): ESLint.LintResult {
  return { filePath: `${ROOT}/${file}`, messages } as ESLint.LintResult;
}

describe('collectWarnings', () => {
  it('splits warnings, errors and parse failures, with repository paths', () => {
    const outcome = collectWarnings(ROOT, [
      result('src/a.ts', [
        message({ line: 3 }),
        message({
          severity: 2,
          ruleId: 'no-undef',
          message: 'x is not defined',
        }),
        message({
          fatal: true,
          severity: 2,
          ruleId: null,
          message: 'Parsing error',
        }),
      ]),
    ]);
    expect(outcome.warnings).toEqual([
      {
        file: 'src/a.ts',
        construct: 'sonarjs/no-dead-store',
        line: 3,
        column: 1,
      },
    ]);
    expect(outcome.errors).toEqual(['src/a.ts:1:1 no-undef x is not defined']);
    expect(outcome.fatal).toEqual(['src/a.ts:1:1 Parsing error']);
    expect(outcome.filesLinted).toBe(1);
  });

  it('counts an unused eslint-disable directive under its own key', () => {
    const outcome = collectWarnings(ROOT, [
      result('scripts/b.ts', [message({ ruleId: null })]),
    ]);
    expect(outcome.warnings[0]!.construct).toBe(UNUSED_DIRECTIVE);
  });
});

describe('the ratchet', () => {
  const counts = countWarnings([
    { file: 'src/a.ts', construct: 'r1', line: 1, column: 1 },
    { file: 'src/a.ts', construct: 'r1', line: 2, column: 1 },
    { file: 'tests/b.ts', construct: 'r2', line: 1, column: 1 },
  ]);

  it('passes when counts equal the baseline and the base branch', () => {
    const baseline = { sites: counts };
    const r = applyRatchet(counts, baseline, {
      ref: 'origin/master',
      baseline,
    });
    expect(ratchetProblems(r)).toEqual([]);
  });

  it('fails a new warning and names where it is', () => {
    const baseline = {
      sites: { 'src/a.ts': { r1: 1 }, 'tests/b.ts': { r2: 1 } },
    };
    const r = applyRatchet(counts, baseline, {
      ref: 'origin/master',
      baseline,
    });
    const problems = ratchetProblems(r, [
      { file: 'src/a.ts', construct: 'r1', line: 2, column: 1 },
    ]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('src/a.ts r1: 2 (baseline 1)');
    expect(problems[0]).toContain('src/a.ts:2:1');
  });

  it('fails a fixed warning until the baseline is lowered', () => {
    const baseline = { sites: { ...counts, 'src/c.ts': { r3: 1 } } };
    const r = applyRatchet(counts, baseline, {
      ref: 'origin/master',
      baseline,
    });
    expect(ratchetProblems(r).join('\n')).toContain(
      'npm run lint:ratchet -- --update',
    );
    expect(lowerBaseline(counts, baseline)).toEqual({ sites: counts });
  });

  it('fails a baseline that grew against the base branch', () => {
    const baseline = { sites: counts };
    const r = applyRatchet(counts, baseline, {
      ref: 'origin/master',
      baseline: { sites: { 'src/a.ts': { r1: 2 } } },
    });
    expect(ratchetProblems(r).join('\n')).toContain(
      'the baseline only shrinks',
    );
  });

  it('fails closed when no base ref resolves', () => {
    const baseline = { sites: counts };
    const r = applyRatchet(counts, baseline, { ref: null, baseline: null });
    expect(ratchetProblems(r).join('\n')).toContain('WARNING_BASE_REF');
  });

  it('never raises an entry on update', () => {
    const lowered = lowerBaseline(counts, { sites: { 'src/a.ts': { r1: 1 } } });
    expect(lowered).toEqual({ sites: { 'src/a.ts': { r1: 1 } } });
  });

  describe('--update', () => {
    const outcome = (errors: string[] = []) => ({
      warnings: [{ file: 'src/a.ts', construct: 'r1', line: 2, column: 1 }],
      errors,
      fatal: [],
      filesLinted: 2,
    });

    it('passes when it only lowered entries', () => {
      const lowered = lowerBaseline(counts, {
        sites: { ...counts, 'src/c.ts': { r3: 1 } },
      });
      expect(updateProblems(counts, lowered, outcome())).toEqual([]);
    });

    it('still fails a warning it could not add to the baseline', () => {
      const lowered = lowerBaseline(counts, {
        sites: { 'src/a.ts': { r1: 1 }, 'tests/b.ts': { r2: 1 } },
      });
      const problems = updateProblems(counts, lowered, outcome());
      expect(problems).toHaveLength(1);
      expect(problems[0]).toContain('src/a.ts r1: 2 (baseline 1)');
    });

    it('still fails an ESLint error', () => {
      const lowered = lowerBaseline(counts, { sites: counts });
      const problems = updateProblems(
        counts,
        lowered,
        outcome(['src/a.ts:1:1 no-undef x is not defined']),
      );
      expect(problems).toEqual([
        '1 ESLint errors:\n  src/a.ts:1:1 no-undef x is not defined',
      ]);
    });
  });
});

describe('the baseline file', () => {
  it('round-trips', () => {
    const baseline = { sites: { 'src/a.ts': { r1: 2 } } };
    expect(parseBaseline(serializeBaseline(baseline))).toEqual(baseline);
  });

  it.each([
    ['{}', '"sites" must be an object'],
    ['{"sites":{"a.ts":{"r":0}}}', 'must be a positive integer'],
    ['{"sites":{"a.ts":{"r":1.5}}}', 'must be a positive integer'],
  ])('rejects %s', (raw, error) => {
    expect(() => parseBaseline(raw)).toThrow(error);
  });
});

describe('integrityProblems', () => {
  it('reports a run that linted nothing or could not parse a file', () => {
    expect(
      integrityProblems({
        warnings: [],
        errors: [],
        fatal: [],
        filesLinted: 0,
      }),
    ).toHaveLength(1);
    expect(
      integrityProblems({
        warnings: [],
        errors: [],
        fatal: ['a.ts:1:1 x'],
        filesLinted: 1,
      }),
    ).toHaveLength(1);
    expect(integrityProblems({ ...emptyOutcome(), filesLinted: 1 })).toEqual(
      [],
    );
  });
});

function emptyOutcome() {
  return { warnings: [], errors: [], fatal: [], filesLinted: 0 };
}

describe('totalsByRule', () => {
  it('sums across files, most first, ties by name', () => {
    expect(
      totalsByRule({ 'a.ts': { b: 1, a: 2 }, 'b.ts': { b: 1, c: 2 } }),
    ).toEqual([
      ['a', 2],
      ['b', 2],
      ['c', 2],
    ]);
  });
});
