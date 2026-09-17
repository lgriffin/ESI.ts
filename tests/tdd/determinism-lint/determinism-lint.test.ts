/**
 * Self-tests for the determinism lint (npm run lint:determinism).
 *
 * Every restricted construct has a negative fixture in fixtures/violations/,
 * linted through ESLint's Node API with the check's own config as if it were a
 * file in src/. A rule that silently stops firing fails here. The compliant
 * fixtures must produce no findings, and the clock module's fixture, which uses
 * every construct, must produce none at the allow-listed path and all of them
 * anywhere else.
 */
import { readFileSync, readdirSync } from 'fs';
import * as path from 'path';

import {
  BaseBaseline,
  CLOCK_MODULES,
  CONSTRUCTS,
  DeterminismBaseline,
  SiteCounts,
  applyRatchet,
  collectSites,
  countSites,
  createDeterminismLinter,
  integrityProblems,
  lowerBaseline,
  parseBaseline,
  ratchetProblems,
  serializeBaseline,
} from '../../../scripts/determinism-lint-core';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const FIXTURES = path.join(__dirname, 'fixtures');
const eslint = createDeterminismLinter(REPO_ROOT);

async function lint(code: string, filePath: string) {
  const results = await eslint.lintText(code, {
    filePath: path.join(REPO_ROOT, filePath),
  });
  return collectSites(REPO_ROOT, results);
}

function fixture(dir: string, name: string): string {
  return readFileSync(path.join(FIXTURES, dir, name), 'utf-8');
}

const violationFixtures = readdirSync(path.join(FIXTURES, 'violations'))
  .filter((name) => name.endsWith('.ts'))
  .sort();

describe('determinism lint rules', () => {
  it('has exactly one negative fixture per restricted construct', () => {
    expect(violationFixtures.map((name) => name.replace(/\.ts$/, ''))).toEqual(
      [...CONSTRUCTS].sort(),
    );
  });

  it.each(violationFixtures)(
    'rejects violations/%s with exactly that construct',
    async (name) => {
      const outcome = await lint(
        fixture('violations', name),
        `src/core/${name}`,
      );

      expect(outcome.fatal).toEqual([]);
      expect(outcome.sites.map((s) => s.construct)).toEqual([
        name.replace(/\.ts$/, ''),
      ]);
    },
  );

  it.each([
    ['globalThis.setTimeout(done, 10)', 'set-timeout'],
    ['global.setInterval(done, 10)', 'set-interval'],
    ['window.setTimeout(done, 10)', 'set-timeout'],
    ['const schedule = setTimeout', 'set-timeout'],
    ["import { setInterval } from 'node:timers'", 'node-timers'],
    ["import timers from 'timers'", 'node-timers'],
    ['const started = process.hrtime()', 'process-hrtime'],
    ['const r = Math.random', 'math-random'],
  ])('rejects %s as %s', async (code, construct) => {
    const outcome = await lint(code, 'src/core/variant.ts');

    expect(outcome.sites.map((s) => s.construct)).toEqual([construct]);
  });

  it('does not honour an inline eslint-disable comment', async () => {
    const outcome = await lint(
      [
        '// eslint-disable-next-line no-restricted-properties',
        'export const now = Date.now();',
        '/* eslint-disable */',
        'export const later = setTimeout(() => undefined, 1);',
      ].join('\n'),
      'src/core/sneaky.ts',
    );

    expect(outcome.sites.map((s) => s.construct)).toEqual([
      'date-now',
      'set-timeout',
    ]);
  });

  it('allows injected time, Date parsing and look-alike names', async () => {
    const outcome = await lint(
      fixture('compliant', 'injected-clock.ts'),
      'src/core/cache/injected.ts',
    );

    expect(outcome.fatal).toEqual([]);
    expect(outcome.sites).toEqual([]);
    expect(outcome.filesLinted).toBe(1);
  });

  it('allow-lists the clock module path', async () => {
    expect(CLOCK_MODULES).toEqual(['src/core/clock.ts']);

    const outcome = await lint(
      fixture('compliant', 'clock.ts'),
      'src/core/clock.ts',
    );

    expect(outcome.fatal).toEqual([]);
    expect(outcome.filesLinted).toBe(1);
    expect(outcome.sites).toEqual([]);
  });

  it('allow-lists only that path: the same code elsewhere reports every construct', async () => {
    const outcome = await lint(
      fixture('compliant', 'clock.ts'),
      'src/core/util/clock.ts',
    );

    expect(new Set(outcome.sites.map((s) => s.construct))).toEqual(
      new Set(CONSTRUCTS),
    );
  });

  it('applies only to src/', async () => {
    const outcome = await lint(
      fixture('violations', 'date-now.ts'),
      'tests/tdd/whatever.ts',
    );

    expect(outcome.sites).toEqual([]);
  });

  it('reports a file it cannot parse as a broken check', async () => {
    const outcome = await lint('export const = ;', 'src/core/broken.ts');

    expect(integrityProblems(outcome).join('\n')).toMatch(/could not parse 1/);
    expect(
      integrityProblems({ sites: [], filesLinted: 0, fatal: [] }),
    ).toHaveLength(1);
  });
});

describe('determinism baseline ratchet', () => {
  const current: SiteCounts = {
    'src/core/a.ts': { 'date-now': 2, 'set-timeout': 1 },
    'src/core/b.ts': { 'math-random': 1 },
  };
  const baseline: DeterminismBaseline = { sites: current };
  const sameOnBase: BaseBaseline = { ref: 'origin/master', baseline };

  it('counts sites per file and construct, not per line', () => {
    expect(
      countSites([
        { file: 'src/b.ts', construct: 'math-random', line: 9, column: 1 },
        { file: 'src/a.ts', construct: 'date-now', line: 3, column: 1 },
        { file: 'src/a.ts', construct: 'date-now', line: 1, column: 1 },
      ]),
    ).toEqual({
      'src/a.ts': { 'date-now': 2 },
      'src/b.ts': { 'math-random': 1 },
    });
  });

  it('passes when every count matches its entry and the base branch', () => {
    const result = applyRatchet(current, baseline, sameOnBase);

    expect(ratchetProblems(result)).toEqual([]);
  });

  it('fails on a new site in a baselined file, naming its location', () => {
    const grown = { ...current, 'src/core/b.ts': { 'math-random': 2 } };
    const result = applyRatchet(grown, baseline, sameOnBase);

    expect(result.grown).toEqual([
      {
        file: 'src/core/b.ts',
        construct: 'math-random',
        count: 2,
        allowed: 1,
      },
    ]);
    const problems = ratchetProblems(result, [
      { file: 'src/core/b.ts', construct: 'math-random', line: 7, column: 3 },
    ]);
    expect(problems.join('\n')).toMatch(/src\/core\/b\.ts:7:3/);
  });

  it('fails on a new site in a file or construct the baseline does not list', () => {
    const result = applyRatchet(
      {
        ...current,
        'src/core/a.ts': { ...current['src/core/a.ts'], 'new-date': 1 },
        'src/core/c.ts': { 'set-interval': 1 },
      },
      baseline,
      sameOnBase,
    );

    expect(result.grown.map((d) => `${d.file} ${d.construct}`)).toEqual([
      'src/core/a.ts new-date',
      'src/core/c.ts set-interval',
    ]);
    expect(ratchetProblems(result)).toHaveLength(1);
  });

  it('fails on a stale entry: a count that dropped must lower its entry', () => {
    const result = applyRatchet(
      {
        'src/core/a.ts': { 'date-now': 1, 'set-timeout': 1 },
      },
      baseline,
      sameOnBase,
    );

    expect(result.stale).toEqual([
      { file: 'src/core/a.ts', construct: 'date-now', count: 1, allowed: 2 },
      { file: 'src/core/b.ts', construct: 'math-random', count: 0, allowed: 1 },
    ]);
    expect(ratchetProblems(result).join('\n')).toMatch(/--update/);
  });

  it('fails on an entry above the base branch: the baseline only shrinks', () => {
    const grownBaseline = {
      sites: { ...current, 'src/core/c.ts': { 'set-interval': 1 } },
    };
    const result = applyRatchet(
      { ...current, 'src/core/c.ts': { 'set-interval': 1 } },
      grownBaseline,
      {
        ref: 'origin/master',
        baseline: {
          sites: {
            ...current,
            'src/core/a.ts': { 'date-now': 1, 'set-timeout': 1 },
          },
        },
      },
    );

    expect(result.grown).toEqual([]);
    expect(result.stale).toEqual([]);
    expect(result.added.map((d) => `${d.file} ${d.construct}`)).toEqual([
      'src/core/a.ts date-now',
      'src/core/c.ts set-interval',
    ]);
    expect(ratchetProblems(result).join('\n')).toMatch(/only shrinks/);
  });

  it('fails closed when no base ref resolves', () => {
    const result = applyRatchet(current, baseline, {
      ref: null,
      baseline: null,
    });

    expect(result.baseRefMissing).toBe(true);
    expect(result.added).toHaveLength(3);
    expect(ratchetProblems(result).join('\n')).toMatch(/DETERMINISM_BASE_REF/);
  });

  it('needs no base ref when the baseline is empty and nothing is found', () => {
    const result = applyRatchet(
      {},
      { sites: {} },
      { ref: null, baseline: null },
    );

    expect(ratchetProblems(result)).toEqual([]);
  });

  it('accepts the entries of the change that introduces the baseline file', () => {
    const result = applyRatchet(current, baseline, {
      ref: 'origin/master',
      baseline: null,
    });

    expect(ratchetProblems(result)).toEqual([]);
  });

  it('--update lowers entries and never raises or adds one', () => {
    const lowered = lowerBaseline(
      {
        'src/core/a.ts': { 'date-now': 1, 'set-timeout': 3 },
        'src/core/c.ts': { 'set-interval': 1 },
      },
      baseline,
    );

    expect(lowered.sites).toEqual({
      'src/core/a.ts': { 'date-now': 1, 'set-timeout': 1 },
    });
  });

  it('--update records every site only when there is no baseline yet', () => {
    expect(lowerBaseline(current, null).sites).toEqual(current);
  });

  it('round-trips the baseline file and rejects malformed entries', () => {
    expect(parseBaseline(serializeBaseline(baseline))).toEqual(baseline);
    expect(() => parseBaseline('{}')).toThrow(/sites/);
    expect(() => parseBaseline('{"sites":{"src/a.ts":{"sundial":1}}}')).toThrow(
      /unknown construct/,
    );
    expect(() =>
      parseBaseline('{"sites":{"src/a.ts":{"date-now":0}}}'),
    ).toThrow(/positive integer/);
  });

  it('the committed baseline parses and names only files that exist', () => {
    const committed = parseBaseline(
      readFileSync(
        path.join(REPO_ROOT, 'scripts/determinism-baseline.json'),
        'utf-8',
      ),
    );

    for (const file of Object.keys(committed.sites)) {
      expect(file).toMatch(/^src\/.+\.ts$/);
      expect(() => readFileSync(path.join(REPO_ROOT, file))).not.toThrow();
      expect(CLOCK_MODULES).not.toContain(file);
    }
  });
});
