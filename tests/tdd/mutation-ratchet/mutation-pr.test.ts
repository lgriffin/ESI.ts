/**
 * Self-tests for the pull request mutation ratchet (scripts/mutation-pr.ts,
 * npm run mutation:pr) and the known-weak fixture check
 * (scripts/mutation-fixture.ts). Each test is a way the gate could pass when
 * it should not: a score below its floor, a floor lowered or removed, a
 * baseline that cannot be read, a directory with no floor, a run scored on a
 * subset of a directory, or a fixture that stopped showing survivors.
 */
import {
  Git,
  MutationCheckError,
  MutationReport,
  PrPlan,
  applyRatchet,
  fixtureSignalProblems,
  gatePrRun,
  globToRegExp,
  inMutationScope,
  parseThresholds,
  planPrRun,
  readThresholdPair,
  renderPrSummary,
  resolveBaseRef,
  scoreByDirectory,
  scoreFiles,
  thresholdDecreases,
  undetectedMutants,
} from '../../../scripts/mutation-ratchet-core';

const UNIT_SCOPE = [
  'src/core/**/*.ts',
  '!src/core/endpoints/**',
  '!src/core/cache/ICache.ts',
];

function report(files: Record<string, string[]>): MutationReport {
  return {
    files: Object.fromEntries(
      Object.entries(files).map(([file, statuses]) => [
        file,
        {
          mutants: statuses.map((status, i) => ({
            status,
            mutatorName: 'ConditionalExpression',
            replacement: 'false',
            location: { start: { line: i + 1, column: 1 } },
          })),
        },
      ]),
    ),
  } as MutationReport;
}

/** A git stub: `commits` resolve, `blobs` maps `<ref>:<path>` to contents. */
function fakeGit(
  commits: string[],
  blobs: Record<string, string> = {},
  mergeBase = 'abc123',
): Git {
  return (args) => {
    const [cmd, ...rest] = args;
    if (cmd === 'rev-parse') {
      const ref = rest[rest.length - 1]!.replace('^{commit}', '');
      if (commits.includes(ref)) return `${ref}\n`;
      throw new Error('unknown revision');
    }
    if (cmd === 'merge-base') return `${mergeBase}\n`;
    if (cmd === 'cat-file' || cmd === 'show') {
      const spec = rest[rest.length - 1]!;
      if (spec in blobs) return blobs[spec]!;
      throw new Error(`path not in ${spec}`);
    }
    throw new Error(`unexpected git ${args.join(' ')}`);
  };
}

function plan(overrides: Partial<Parameters<typeof planPrRun>[0]> = {}) {
  return planPrRun({
    changedFiles: [],
    trackedFiles: [
      'src/core/cache/ETagCacheManager.ts',
      'src/core/cache/cacheKey.ts',
      'src/core/cache/ICache.ts',
      'src/core/util/sleep.ts',
      'src/clients/MarketClient.ts',
    ],
    mutatePatterns: UNIT_SCOPE,
    baselineSources: null,
    readSource: () => 'source',
    ...overrides,
  });
}

describe('mutation scope globs', () => {
  it.each([
    ['src/core/**/*.ts', 'src/core/ApiClient.ts', true],
    ['src/core/**/*.ts', 'src/core/cache/ETagCacheManager.ts', true],
    ['src/core/**/*.ts', 'src/clients/MarketClient.ts', false],
    ['src/core/endpoints/**', 'src/core/endpoints/a/b.ts', true],
    ['src/**/I[A-Z]*.ts', 'src/core/ICache.ts', false],
    ['src/core/?.ts', 'src/core/a.ts', true],
    ['src/core/*.ts', 'src/core/cache/x.ts', false],
  ])('%s matches %s: %s', (pattern, file, expected) => {
    expect(globToRegExp(pattern).test(file)).toBe(expected);
  });

  it('excludes a file matched by a negated pattern', () => {
    expect(inMutationScope('src/core/cache/ICache.ts', UNIT_SCOPE)).toBe(false);
    expect(inMutationScope('src\\core\\cache\\cacheKey.ts', UNIT_SCOPE)).toBe(
      true,
    );
  });
});

describe('pull request mutation plan', () => {
  it('skips when the pull request changes nothing under src/', () => {
    const result = plan({ changedFiles: ['README.md', 'tests/tdd/a.test.ts'] });
    expect(result).toMatchObject({
      skip: true,
      reason: 'This pull request changes no files under src/.',
      mutate: [],
      directories: [],
    });
  });

  it('skips, naming the files, when src/ changes are all outside the unit scope', () => {
    const result = plan({
      changedFiles: ['src/clients/MarketClient.ts', 'src/core/cache/ICache.ts'],
    });
    expect(result.skip).toBe(true);
    expect(result.reason).toMatch(/none inside the unit mutation scope/);
    expect(result.outOfScope).toEqual([
      'src/clients/MarketClient.ts',
      'src/core/cache/ICache.ts',
    ]);
  });

  it('with no baseline, mutates every in-scope file of each touched directory', () => {
    const result = plan({
      changedFiles: ['src/core/cache/ETagCacheManager.ts', 'README.md'],
    });
    expect(result.skip).toBe(false);
    expect(result.directories).toEqual(['src/core/cache']);
    expect(result.changed).toEqual(['src/core/cache/ETagCacheManager.ts']);
    expect(result.mutate).toEqual([
      'src/core/cache/ETagCacheManager.ts',
      'src/core/cache/cacheKey.ts',
    ]);
  });

  it('with a baseline, mutates only changed files and siblings whose source moved on', () => {
    const baselineSources = new Map([
      ['src/core/cache/ETagCacheManager.ts', 'old'],
      ['src/core/cache/cacheKey.ts', 'same\r\n'],
    ]);
    const unchanged = plan({
      changedFiles: ['src/core/cache/ETagCacheManager.ts'],
      baselineSources,
      readSource: () => 'same\n',
    });
    expect(unchanged.mutate).toEqual(['src/core/cache/ETagCacheManager.ts']);

    const drifted = plan({
      changedFiles: ['src/core/cache/ETagCacheManager.ts'],
      baselineSources,
      readSource: () => 'master changed this since the nightly',
    });
    expect(drifted.mutate).toEqual([
      'src/core/cache/ETagCacheManager.ts',
      'src/core/cache/cacheKey.ts',
    ]);
  });
});

describe('pull request ratchet gate', () => {
  const touched: PrPlan = plan({
    changedFiles: ['src/core/cache/ETagCacheManager.ts'],
  });
  const run = report({
    'src/core/cache/ETagCacheManager.ts': ['Killed', 'Survived', 'NoCoverage'],
    'src/core/cache/cacheKey.ts': ['Killed'],
    'src/core/util/sleep.ts': ['Survived'],
  });

  it('fails a touched directory that drops below its threshold', () => {
    const { scores, failures } = gatePrRun(run, touched, {
      'src/core/cache': 60,
      'src/core/util': 100,
    });
    expect(scores).toEqual([
      { directory: 'src/core/cache', detected: 2, valid: 4, score: 50 },
    ]);
    // src/core/util is below its floor too, but this pull request did not touch it.
    expect(failures).toEqual([
      'src/core/cache: mutation score 50% is below its ratchet of 60%',
    ]);
  });

  it('passes a touched directory at or above its threshold', () => {
    expect(gatePrRun(run, touched, { 'src/core/cache': 50 }).failures).toEqual(
      [],
    );
  });

  it('fails closed when a touched directory has no threshold', () => {
    expect(gatePrRun(run, touched, {}).failures).toEqual([
      'src/core/cache: mutation score 50% has no ratchet; add "src/core/cache": 50 to the thresholds file',
    ]);
  });

  it('fails closed when a touched directory with a threshold scored no mutants', () => {
    expect(
      gatePrRun(report({}), touched, { 'src/core/cache': 50 }).failures,
    ).toEqual([
      'src/core/cache: has a ratchet but no mutants were scored; was it excluded from the run?',
    ]);
  });

  it('summarises per-file scores and lists the undetected mutants', () => {
    const { scores, failures } = gatePrRun(run, touched, {
      'src/core/cache': 60,
    });
    const files = scoreFiles(run, touched.changed);
    expect(files).toEqual([
      {
        file: 'src/core/cache/ETagCacheManager.ts',
        detected: 1,
        valid: 3,
        survived: 1,
        noCoverage: 1,
        score: 33.3,
      },
    ]);
    const undetected = undetectedMutants(run, touched.changed);
    expect(undetected.map((m) => `${m.line}:${m.status}`)).toEqual([
      '2:Survived',
      '3:NoCoverage',
    ]);
    const text = renderPrSummary({
      plan: touched,
      scores,
      thresholds: { 'src/core/cache': 60 },
      files,
      undetected,
      failures,
      baseline: 'test baseline',
    });
    expect(text).toContain('| `src/core/cache` | 50% | 2/4 | 60% |');
    expect(text).toContain(
      '| `src/core/cache/ETagCacheManager.ts` | 33.3% | 1/3 | 1 | 1 |',
    );
    expect(text).toContain(
      '| `src/core/cache/ETagCacheManager.ts:2` | Survived | ConditionalExpression | `false` |',
    );
    expect(text).toContain('**Ratchet failures**');
  });
});

describe('thresholds file ratchet direction', () => {
  it('rejects a lowered threshold', () => {
    expect(
      thresholdDecreases(
        { 'src/core/cache': 53.3 },
        { 'src/core/cache': 50 },
        'mutation-thresholds.json',
      ),
    ).toEqual([
      'mutation-thresholds.json: "src/core/cache" was lowered from 53.3% to 50%; ratchets only move up',
    ]);
  });

  it('rejects a removed threshold', () => {
    expect(
      thresholdDecreases({ 'src/core/cache': 53.3 }, {}, 'm.json'),
    ).toEqual([
      'm.json: "src/core/cache" was removed; ratchets only move up (base 53.3%)',
    ]);
  });

  it('accepts raised and added thresholds', () => {
    expect(
      thresholdDecreases(
        { 'src/core/cache': 53.3 },
        { 'src/core/cache': 60, 'src/core/new': 70 },
        'm.json',
      ),
    ).toEqual([]);
  });

  it('has nothing to compare only when the base predates the file', () => {
    expect(thresholdDecreases(null, { 'src/core': 1 }, 'm.json')).toEqual([]);
  });
});

describe('baselines fail closed', () => {
  const file = 'mutation-thresholds.json';

  it('throws when the head thresholds file is missing', () => {
    expect(() =>
      readThresholdPair(fakeGit(['base']), 'base', file, null),
    ).toThrow(new MutationCheckError(`${file} is missing; failing closed.`));
  });

  it.each([
    ['not JSON', '{', /is not valid JSON/],
    ['an array', '[]', /must be an object/],
    ['a non-number', '{"src/core": "80"}', /must be a percentage/],
    ['out of range', '{"src/core": 101}', /must be a percentage/],
  ])('throws when the head thresholds file is %s', (_label, raw, message) => {
    expect(() =>
      readThresholdPair(fakeGit(['base']), 'base', file, raw),
    ).toThrow(message);
  });

  it('throws when the base copy is unreadable', () => {
    const git = fakeGit(['base'], { [`base:${file}`]: 'garbage' });
    expect(() => readThresholdPair(git, 'base', file, '{}')).toThrow(
      MutationCheckError,
    );
  });

  it('returns a null base only when the base commit predates the file', () => {
    expect(
      readThresholdPair(fakeGit(['base']), 'base', file, '{"src/core": 80}'),
    ).toEqual({ head: { 'src/core': 80 }, base: null });
    const git = fakeGit(['base'], { [`base:${file}`]: '{"src/core": 81}' });
    expect(readThresholdPair(git, 'base', file, '{"src/core": 80}')).toEqual({
      head: { 'src/core': 80 },
      base: { 'src/core': 81 },
    });
  });

  it('throws when the explicit base ref is not in the checkout', () => {
    expect(() => resolveBaseRef(fakeGit([]), 'HEAD^1')).toThrow(
      /MUTATION_BASE_REF=HEAD\^1 is not a commit/,
    );
  });

  it('throws when no base ref can be found', () => {
    expect(() => resolveBaseRef(fakeGit([]))).toThrow(
      /No base to diff against/,
    );
  });

  it('uses the explicit base, else the merge base with master', () => {
    expect(resolveBaseRef(fakeGit(['HEAD^1']), 'HEAD^1')).toBe('HEAD^1');
    expect(resolveBaseRef(fakeGit(['master'], {}, 'f00d'))).toBe('f00d');
  });

  it('parses a valid thresholds file', () => {
    expect(parseThresholds('{"src/core/cache": 53.3}', file)).toEqual({
      'src/core/cache': 53.3,
    });
  });
});

describe('known-weak fixture signal', () => {
  const dir = 'tests/mutation-fixture/weakClamp.ts';

  it('passes when the fixture shows both killed and surviving mutants', () => {
    expect(
      fixtureSignalProblems(report({ [dir]: ['Killed', 'Survived'] })),
    ).toEqual([]);
  });

  it('fails when nothing survives, as a broken run that kills everything would', () => {
    expect(fixtureSignalProblems(report({ [dir]: ['Killed'] }))).toEqual([
      expect.stringMatching(/no fixture mutant survived/),
      expect.stringMatching(/ratchet did not fail the fixture/),
    ]);
  });

  it('fails when nothing is killed, as a run testing the unmutated source would', () => {
    expect(
      fixtureSignalProblems(report({ [dir]: ['Survived', 'NoCoverage'] })),
    ).toEqual([expect.stringMatching(/no fixture mutant was killed/)]);
  });

  it('fails when the run produced no mutants', () => {
    expect(fixtureSignalProblems(report({}))).toEqual([
      'the fixture run produced no mutants',
    ]);
  });

  it('unit ratchet requires an entry only when asked', () => {
    const scores = scoreByDirectory(report({ [dir]: ['Killed'] }));
    expect(applyRatchet(scores, {}).failures).toEqual([]);
    expect(
      applyRatchet(scores, {}, { requireEntry: true, label: 'mutation' })
        .failures,
    ).toHaveLength(1);
  });
});
