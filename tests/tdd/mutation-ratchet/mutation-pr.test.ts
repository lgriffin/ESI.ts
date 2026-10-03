/**
 * Self-tests for the pull request mutation ratchet (scripts/mutation/mutation-pr.ts,
 * npm run mutation:pr) and the known-weak fixture check
 * (scripts/mutation/mutation-fixture.ts). Each test is a way the gate could pass when
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
  classifyPrMutationRun,
  coverageFromReport,
  fixtureSignalProblems,
  gatePrRun,
  globToRegExp,
  inMutationScope,
  invalidateForChangedTests,
  isTestFile,
  killsFromReport,
  parseThresholds,
  planPrRun,
  readThresholdPair,
  renderPrSummary,
  resolveBaseRef,
  scoreByDirectory,
  scoreFiles,
  sourceDirectoryForTest,
  thresholdDecreases,
  undetectedMutants,
} from '../../../scripts/mutation/mutation-ratchet-core';

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

describe('coverage from the incremental report', () => {
  it('maps each source file to the test files whose tests cover its mutants', () => {
    const coverage = coverageFromReport(
      {
        files: {
          'src/core/cache/cacheKey.ts': {
            mutants: [{ coveredBy: ['1', '2'] }, { coveredBy: ['2'] }],
          },
          'src/core/cache/ETagCacheManager.ts': {
            mutants: [{ coveredBy: ['1'] }, { coveredBy: [] }, {}],
          },
          'src/core/util/sleep.ts': { mutants: [{ coveredBy: ['gone'] }] },
        },
        testFiles: {
          'tests/tdd/core/cache/cacheKey.test.ts': {
            tests: [{ id: '1' }, { id: '2' }],
          },
          'tests/tdd/core/cache/ETagCacheManager.test.ts': { tests: [] },
        },
      },
      (f) => f,
    );
    expect(coverage).not.toBeNull();
    expect(coverage!.get('src/core/cache/cacheKey.ts')).toEqual(
      new Set(['tests/tdd/core/cache/cacheKey.test.ts']),
    );
    expect(coverage!.get('src/core/cache/ETagCacheManager.ts')).toEqual(
      new Set(['tests/tdd/core/cache/cacheKey.test.ts']),
    );
    // An unknown test id maps to no file.
    expect(coverage!.get('src/core/util/sleep.ts')).toEqual(new Set());
  });

  it('maps the report paths to the repository', () => {
    const coverage = coverageFromReport(
      {
        files: {
          '/runner/work/src/core/cache/cacheKey.ts': {
            mutants: [{ coveredBy: ['1'] }],
          },
        },
        testFiles: {
          '/runner/work/tests/tdd/a.test.ts': { tests: [{ id: '1' }] },
        },
      },
      (f) => f.replace('/runner/work/', ''),
    );
    expect(coverage!.get('src/core/cache/cacheKey.ts')).toEqual(
      new Set(['tests/tdd/a.test.ts']),
    );
  });

  it('is null when the report carries no test files', () => {
    expect(
      coverageFromReport({ files: { 'src/a.ts': { mutants: [] } } }),
    ).toBeNull();
  });

  it.each([
    ['tests/tdd/core/cache/cacheKey.test.ts', 'src/core/cache'],
    ['tests/tdd/core/RetryBackoff.test.ts', 'src/core'],
    ['tests/tdd/auth/EsiTokenManager.test.ts', 'src/auth'],
    ['tests\\tdd\\clients\\MarketClient.test.ts', 'src/clients'],
    ['tests/bdd/steps/then/a.ts', null],
    ['tests/tdd/a.test.ts', null],
  ])(
    'reads the directory a unit test sits over from its path: %s',
    (test, expected) => {
      expect(sourceDirectoryForTest(test)).toBe(expected);
    },
  );
});

describe('verdicts a changed test can overturn (#571)', () => {
  const incremental = {
    files: {
      '/runner/work/src/core/cache/ETagCacheManager.ts': {
        mutants: [
          { status: 'Killed', killedBy: ['1'], coveredBy: ['1', '3'] },
          { status: 'Killed', killedBy: ['3'], coveredBy: ['1', '3'] },
          { status: 'Timeout', coveredBy: ['1'] },
          { status: 'Survived', coveredBy: ['1'] },
          { status: 'NoCoverage' },
        ],
      },
      '/runner/work/src/core/cache/cacheKey.ts': {
        mutants: [{ status: 'Killed', killedBy: ['2'], coveredBy: ['1', '2'] }],
      },
    },
    testFiles: {
      '/runner/work/tests/tdd/core/loggerLevelEnabled.test.ts': {
        tests: [{ id: '1' }],
      },
      '/runner/work/tests/tdd/core/cache/cacheKey.test.ts': {
        tests: [{ id: '2' }],
      },
      '/runner/work/tests/tdd/core/cache/ETagCacheManager.test.ts': {
        tests: [{ id: '3' }],
      },
    },
  };
  const toRepo = (f: string) => f.replace('/runner/work/', '');

  it('ties a Killed verdict to its killing tests, Timeout and Survived to their covering tests', () => {
    const kills = killsFromReport(incremental, toRepo);
    expect(kills!.get('src/core/cache/ETagCacheManager.ts')).toEqual(
      new Set([
        'tests/tdd/core/loggerLevelEnabled.test.ts',
        'tests/tdd/core/cache/ETagCacheManager.test.ts',
      ]),
    );
    // A Killed verdict rests on its killer, not on every covering test.
    expect(kills!.get('src/core/cache/cacheKey.ts')).toEqual(
      new Set(['tests/tdd/core/cache/cacheKey.test.ts']),
    );
    expect(
      killsFromReport({ files: { 'src/a.ts': { mutants: [] } } }),
    ).toBeNull();
  });

  it.each([
    [
      'a Killed mutant without killedBy',
      { status: 'Killed', coveredBy: ['1'] },
    ],
    ['a Timeout mutant without coveredBy', { status: 'Timeout' }],
    ['a Survived mutant without coveredBy', { status: 'Survived' }],
  ])(
    'gives no kill index when %s, so no changed test is ruled out',
    (_, mutant) => {
      const report = {
        files: { 'src/a.ts': { mutants: [mutant] } },
        testFiles: { 'tests/a.test.ts': { tests: [{ id: '1' }] } },
      };
      expect(killsFromReport(report)).toBeNull();
    },
  );

  it('drops only the mutants whose verdict rests on a changed test', () => {
    const { report: pruned, dropped } = invalidateForChangedTests(
      incremental,
      ['tests/tdd/core/loggerLevelEnabled.test.ts'],
      toRepo,
    );
    expect(
      pruned.files['/runner/work/src/core/cache/ETagCacheManager.ts']!.mutants,
    ).toEqual([
      { status: 'Killed', killedBy: ['3'], coveredBy: ['1', '3'] },
      { status: 'NoCoverage' },
    ]);
    expect(
      pruned.files['/runner/work/src/core/cache/cacheKey.ts']!.mutants,
    ).toHaveLength(1);
    expect(dropped).toEqual(
      new Map([['src/core/cache/ETagCacheManager.ts', 3]]),
    );
    expect(pruned.testFiles).toBe(incremental.testFiles);
    // The input report is left as it was.
    expect(
      incremental.files['/runner/work/src/core/cache/ETagCacheManager.ts']
        .mutants,
    ).toHaveLength(5);
  });

  it.each([
    ['tests/tdd/core/cache/cacheKey.test.ts', true],
    ['tests\\tdd\\core\\a.test.ts', true],
    ['tests/tdd/helpers/clientErrorTests.ts', false],
    ['tests/setup/jest.setup.ts', false],
    ['tests/bdd/support/steps.ts', false],
  ])('treats %s as a test file: %s', (file, expected) => {
    expect(isTestFile(file)).toBe(expected);
  });
});

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

  it('mutates a vouched sibling again when a changed test covered it (#380)', () => {
    const baselineSources = new Map([
      ['src/core/cache/ETagCacheManager.ts', 'old'],
      ['src/core/cache/cacheKey.ts', 'same'],
      ['src/core/cache/CacheHeaders.ts', 'same'],
    ]);
    const baselineCoverage = new Map([
      ['src/core/cache/ETagCacheManager.ts', new Set<string>()],
      [
        'src/core/cache/cacheKey.ts',
        new Set(['tests/tdd/core/cache/cacheKey.test.ts']),
      ],
      [
        'src/core/cache/CacheHeaders.ts',
        new Set(['tests/tdd/core/cache/CacheHeaders.test.ts']),
      ],
    ]);
    const base = {
      changedFiles: ['src/core/cache/ETagCacheManager.ts'],
      trackedFiles: [
        'src/core/cache/ETagCacheManager.ts',
        'src/core/cache/CacheHeaders.ts',
        'src/core/cache/cacheKey.ts',
      ],
      baselineSources,
      baselineCoverage,
      readSource: () => 'same',
    };
    // Only the sibling whose mutants the changed test reached last night can
    // lose a kill; the other keeps the nightly's verdict.
    const changed = plan({
      ...base,
      changedTestFiles: ['tests/tdd/core/cache/cacheKey.test.ts'],
    });
    expect(changed.retested).toEqual(['src/core/cache/cacheKey.ts']);
    expect(changed.mutate).toEqual([
      'src/core/cache/ETagCacheManager.ts',
      'src/core/cache/cacheKey.ts',
    ]);
    expect(changed.nightly).toEqual(['src/core/cache/CacheHeaders.ts']);
    expect(changed.force).toBe(true);

    // A test the report never saw (a new file) can only add kills, which the
    // next nightly records: nothing is retested, nothing is reused wrongly.
    const added = plan({
      ...base,
      changedTestFiles: ['tests/tdd/core/cache/ETagCacheManager.test.ts'],
    });
    expect(added.retested).toEqual([]);
    expect(added.mutate).toEqual(['src/core/cache/ETagCacheManager.ts']);
    expect(added.force).toBe(true);

    // A deleted test is in the diff and counts the same as a changed one.
    const deleted = plan({
      ...base,
      changedTestFiles: ['tests/tdd/core/cache/CacheHeaders.test.ts'],
    });
    expect(deleted.retested).toEqual(['src/core/cache/CacheHeaders.ts']);

    const untouched = plan({ ...base, changedTestFiles: [] });
    expect(untouched.retested).toEqual([]);
    expect(untouched.nightly).toEqual([
      'src/core/cache/CacheHeaders.ts',
      'src/core/cache/cacheKey.ts',
    ]);
    expect(untouched.force).toBe(false);
  });

  it('invalidates the verdicts a changed test decided instead of forcing whole files (#571)', () => {
    const base = {
      changedFiles: ['src/core/cache/ETagCacheManager.ts'],
      trackedFiles: [
        'src/core/cache/ETagCacheManager.ts',
        'src/core/cache/CacheHeaders.ts',
        'src/core/cache/cacheKey.ts',
      ],
      baselineSources: new Map([
        ['src/core/cache/ETagCacheManager.ts', 'old'],
        ['src/core/cache/cacheKey.ts', 'same'],
        ['src/core/cache/CacheHeaders.ts', 'same'],
      ]),
      // loggerLevelEnabled covers both siblings but only kills in cacheKey.
      baselineCoverage: new Map([
        [
          'src/core/cache/cacheKey.ts',
          new Set(['tests/tdd/core/loggerLevelEnabled.test.ts']),
        ],
        [
          'src/core/cache/CacheHeaders.ts',
          new Set(['tests/tdd/core/loggerLevelEnabled.test.ts']),
        ],
      ]),
      baselineKills: new Map([
        ['src/core/cache/ETagCacheManager.ts', new Set<string>()],
        [
          'src/core/cache/cacheKey.ts',
          new Set(['tests/tdd/core/loggerLevelEnabled.test.ts']),
        ],
        ['src/core/cache/CacheHeaders.ts', new Set<string>()],
      ]),
      readSource: () => 'same',
    };

    // The #568 shape: one source file and one test file changed.
    const precise = plan({
      ...base,
      changedTestFiles: ['tests/tdd/core/loggerLevelEnabled.test.ts'],
    });
    expect(precise.force).toBe(false);
    expect(precise.invalidate).toEqual([
      'tests/tdd/core/loggerLevelEnabled.test.ts',
    ]);
    expect(precise.retested).toEqual(['src/core/cache/cacheKey.ts']);
    expect(precise.nightly).toEqual(['src/core/cache/CacheHeaders.ts']);

    // A changed helper can change any test, so the run still forces.
    const helper = plan({
      ...base,
      changedTestFiles: [
        'tests/tdd/core/loggerLevelEnabled.test.ts',
        'tests/tdd/helpers/spyLogger.ts',
      ],
    });
    expect(helper.force).toBe(true);
    expect(helper.invalidate).toEqual([]);
    expect(helper.retested).toEqual([
      'src/core/cache/CacheHeaders.ts',
      'src/core/cache/cacheKey.ts',
    ]);

    // No kill index in the report: as before, force.
    const noKills = plan({
      ...base,
      baselineKills: null,
      changedTestFiles: ['tests/tdd/core/loggerLevelEnabled.test.ts'],
    });
    expect(noKills.force).toBe(true);
    expect(noKills.invalidate).toEqual([]);

    const untouched = plan({ ...base, changedTestFiles: [] });
    expect(untouched.force).toBe(false);
    expect(untouched.invalidate).toEqual([]);
    expect(untouched.retested).toEqual([]);
  });

  it('retests every vouched sibling when it cannot tell which tests covered what', () => {
    const baselineSources = new Map([
      ['src/core/cache/ETagCacheManager.ts', 'old'],
      ['src/core/cache/cacheKey.ts', 'same'],
    ]);
    // The report carries no per-test coverage.
    const noCoverage = plan({
      changedFiles: ['src/core/cache/ETagCacheManager.ts'],
      baselineSources,
      readSource: () => 'same',
      changedTestFiles: ['tests/tdd/core/RetryStrategy.test.ts'],
    });
    expect(noCoverage.retested).toEqual(['src/core/cache/cacheKey.ts']);
    expect(noCoverage.nightly).toEqual([]);
    expect(noCoverage.force).toBe(true);

    // The tests diff could not be read: tests may have changed.
    const unknown = plan({
      changedFiles: ['src/core/cache/ETagCacheManager.ts'],
      baselineSources,
      baselineCoverage: new Map([
        ['src/core/cache/cacheKey.ts', new Set<string>()],
      ]),
      readSource: () => 'same',
      changedTestFiles: null,
    });
    expect(unknown.retested).toEqual(['src/core/cache/cacheKey.ts']);
    expect(unknown.force).toBe(true);

    // The report knows coverage but not this file: nothing vouches for it.
    const unlisted = plan({
      changedFiles: ['src/core/cache/ETagCacheManager.ts'],
      baselineSources,
      baselineCoverage: new Map(),
      readSource: () => 'same',
      changedTestFiles: ['tests/tdd/core/RetryStrategy.test.ts'],
    });
    expect(unlisted.retested).toEqual(['src/core/cache/cacheKey.ts']);
  });

  it('mutates the directories a test-only pull request reaches, by coverage and by layout', () => {
    const baselineSources = new Map([
      ['src/core/cache/ETagCacheManager.ts', 'same'],
      ['src/core/cache/cacheKey.ts', 'same'],
      ['src/core/util/sleep.ts', 'same'],
    ]);
    const baselineCoverage = new Map([
      ['src/core/cache/ETagCacheManager.ts', new Set<string>()],
      ['src/core/cache/cacheKey.ts', new Set<string>()],
      [
        'src/core/util/sleep.ts',
        new Set(['tests/bdd/step-definitions/core/resilience.steps.ts']),
      ],
    ]);
    const result = plan({
      changedFiles: ['tests/bdd/step-definitions/core/resilience.steps.ts'],
      baselineSources,
      baselineCoverage,
      readSource: () => 'same',
      changedTestFiles: [
        'tests/bdd/step-definitions/core/resilience.steps.ts',
        'tests/tdd/core/cache/cacheKey.test.ts',
      ],
    });
    expect(result.skip).toBe(false);
    expect(result.changed).toEqual([]);
    expect(result.directories).toEqual(['src/core/cache', 'src/core/util']);
    // Only the file the changed step file covered is mutated again; the
    // cache files reached by layout alone keep the nightly's verdicts.
    expect(result.mutate).toEqual(['src/core/util/sleep.ts']);
    expect(result.retested).toEqual(result.mutate);
    expect(result.nightly).toEqual([
      'src/core/cache/ETagCacheManager.ts',
      'src/core/cache/cacheKey.ts',
    ]);
    expect(result.force).toBe(true);
  });

  it('skips a test-only pull request whose tests covered nothing, saying it cannot lower a score', () => {
    const result = plan({
      changedFiles: ['tests/tdd/core/cache/cacheKey.test.ts'],
      changedTestFiles: ['tests/tdd/core/cache/cacheKey.test.ts'],
      baselineSources: new Map([
        ['src/core/cache/ETagCacheManager.ts', 'same'],
        ['src/core/cache/cacheKey.ts', 'same'],
      ]),
      baselineCoverage: new Map([
        ['src/core/cache/ETagCacheManager.ts', new Set<string>()],
        ['src/core/cache/cacheKey.ts', new Set<string>()],
      ]),
      readSource: () => 'same',
    });
    expect(result.skip).toBe(true);
    expect(result.reason).toMatch(/cannot lower a score/);
    expect(result.reason).toMatch(/none of them covered a mutant/);
    expect(result.directories).toEqual(['src/core/cache']);
    expect(result.mutate).toEqual([]);

    // With a kill index the test decided no verdict, though it may cover one.
    const precise = plan({
      changedFiles: ['tests/tdd/core/cache/cacheKey.test.ts'],
      changedTestFiles: ['tests/tdd/core/cache/cacheKey.test.ts'],
      baselineSources: new Map([
        ['src/core/cache/ETagCacheManager.ts', 'same'],
        ['src/core/cache/cacheKey.ts', 'same'],
      ]),
      baselineCoverage: new Map([
        ['src/core/cache/ETagCacheManager.ts', new Set<string>()],
        [
          'src/core/cache/cacheKey.ts',
          new Set(['tests/tdd/core/cache/cacheKey.test.ts']),
        ],
      ]),
      baselineKills: new Map([
        ['src/core/cache/ETagCacheManager.ts', new Set<string>()],
        ['src/core/cache/cacheKey.ts', new Set<string>()],
      ]),
      readSource: () => 'same',
    });
    expect(precise.skip).toBe(true);
    expect(precise.reason).toMatch(
      /none of them killed a mutant, or covered one that survived or timed out/,
    );
    expect(precise.reason).not.toMatch(/none of them covered a mutant/);
  });

  it('skips a test-only pull request it cannot tie to a directory, saying so', () => {
    const result = plan({
      changedFiles: ['tests/bdd/features/core/0001.feature'],
      changedTestFiles: ['tests/bdd/features/core/0001.feature'],
      baselineCoverage: new Map(),
    });
    expect(result.skip).toBe(true);
    expect(result.reason).toMatch(/changes only tests/);
    // A layout match needs an in-scope directory that exists.
    expect(
      plan({
        changedFiles: [],
        changedTestFiles: ['tests/tdd/sde/ingestion/transforms.test.ts'],
      }).skip,
    ).toBe(true);
  });

  it('with no baseline, a changed test adds nothing to retest but still forces', () => {
    const result = plan({
      changedFiles: ['src/core/cache/ETagCacheManager.ts'],
      changedTestFiles: ['tests/tdd/core/cache/cacheKey.test.ts'],
    });
    expect(result.retested).toEqual([]);
    expect(result.mutate).toEqual([
      'src/core/cache/ETagCacheManager.ts',
      'src/core/cache/cacheKey.ts',
    ]);
    expect(result.force).toBe(true);
  });

  it('lists the in-scope siblings a baseline vouches for as nightly, not in mutate', () => {
    const baselineSources = new Map([
      ['src/core/cache/ETagCacheManager.ts', 'old'],
      ['src/core/cache/cacheKey.ts', 'same'],
    ]);
    const result = plan({
      changedFiles: ['src/core/cache/ETagCacheManager.ts'],
      baselineSources,
      readSource: () => 'same',
    });
    expect(result.mutate).toEqual(['src/core/cache/ETagCacheManager.ts']);
    expect(result.nightly).toEqual(['src/core/cache/cacheKey.ts']);
  });

  it('counts a sibling not vouched by the baseline as fresh, not nightly', () => {
    const baselineSources = new Map([
      ['src/core/cache/ETagCacheManager.ts', 'old'],
    ]);
    const result = plan({
      changedFiles: ['src/core/cache/ETagCacheManager.ts'],
      baselineSources,
      readSource: () => 'fresh source',
    });
    expect(result.mutate).toEqual([
      'src/core/cache/ETagCacheManager.ts',
      'src/core/cache/cacheKey.ts',
    ]);
    expect(result.nightly).toEqual([]);
  });

  it('has no nightly part when nothing was restored', () => {
    const result = plan({
      changedFiles: ['src/core/cache/ETagCacheManager.ts'],
    });
    expect(result.mutate).toEqual([
      'src/core/cache/ETagCacheManager.ts',
      'src/core/cache/cacheKey.ts',
    ]);
    expect(result.nightly).toEqual([]);
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

  it('splits a directory score between fresh and nightly results, and names the test-only case', () => {
    const touched: PrPlan = {
      skip: false,
      reason: '',
      changed: ['src/core/cache/ETagCacheManager.ts'],
      outOfScope: [],
      directories: ['src/core/cache'],
      mutate: ['src/core/cache/ETagCacheManager.ts'],
      nightly: ['src/core/cache/cacheKey.ts'],
      retested: [],
      force: true,
    };
    const run = report({
      'src/core/cache/ETagCacheManager.ts': ['Killed'],
      'src/core/cache/cacheKey.ts': ['Survived', 'Survived'],
    });
    const { scores, failures } = gatePrRun(run, touched, {
      'src/core/cache': 40,
    });
    const text = renderPrSummary({
      plan: touched,
      scores,
      thresholds: { 'src/core/cache': 40 },
      files: scoreFiles(run, touched.changed),
      undetected: undetectedMutants(run, touched.changed),
      failures,
      baseline:
        'nightly incremental report restored (1 files); unchanged mutants reuse its results.',
      testFiles: ['tests/tdd/cache/cacheKey.test.ts'],
    });
    expect(scores).toEqual([
      { directory: 'src/core/cache', detected: 1, valid: 3, score: 33.3 },
    ]);
    // The directory score mixes the fresh file with the nightly's survivor, and
    // the summary must say so: partly from the nightly, which files are reused.
    expect(text).toContain(
      '`src/core/cache` is partly from the nightly (1 of 2 files was reused from the restored report, not measured by this run)',
    );
    expect(text).toContain('`src/core/cache/cacheKey.ts`');
    expect(text).toContain('--force');
  });

  it('defers the test-only improvement to the next nightly without blaming the directory', () => {
    const touched: PrPlan = {
      skip: false,
      reason: '',
      changed: ['src/core/cache/ETagCacheManager.ts'],
      outOfScope: [],
      directories: ['src/core/cache'],
      mutate: ['src/core/cache/ETagCacheManager.ts'],
      nightly: [],
      retested: [],
      force: true,
    };
    const run = report({
      'src/core/cache/ETagCacheManager.ts': ['Killed'],
      'src/core/cache/cacheKey.ts': ['Killed'],
    });
    const { scores, failures } = gatePrRun(run, touched, {
      'src/core/cache': 100,
    });
    const text = renderPrSummary({
      plan: touched,
      scores,
      thresholds: { 'src/core/cache': 100 },
      files: scoreFiles(run, touched.changed),
      undetected: [],
      failures,
      baseline: 'test baseline',
      testFiles: ['tests/bdd/steps/logger.feature'],
    });
    expect(failures).toEqual([]);
    // No nightly part was reused, so no "partly from the nightly" claim.
    expect(text).not.toContain('is partly from the nightly');
    // Nothing was reused and nothing retested, so no per-directory note; the
    // run still says it forced every mutant because a test changed.
    expect(text).not.toContain('`src/core/cache`: the changed tests');
    expect(text).toContain(
      'Tests changed, so every mutant of the mutated files ran in this job (`--force`)',
    );
  });

  it('says nothing about nightly reuse when the plan has none', () => {
    const touched: PrPlan = {
      skip: false,
      reason: '',
      changed: ['src/core/cache/ETagCacheManager.ts'],
      outOfScope: [],
      directories: ['src/core/cache'],
      mutate: [
        'src/core/cache/ETagCacheManager.ts',
        'src/core/cache/cacheKey.ts',
      ],
      nightly: [],
      retested: [],
      force: false,
    };
    const run = report({
      'src/core/cache/ETagCacheManager.ts': ['Killed'],
      'src/core/cache/cacheKey.ts': ['Killed'],
    });
    const { scores, failures } = gatePrRun(run, touched, {
      'src/core/cache': 100,
    });
    const text = renderPrSummary({
      plan: touched,
      scores,
      thresholds: { 'src/core/cache': 100 },
      files: scoreFiles(run, touched.changed),
      undetected: [],
      failures,
      baseline:
        'no nightly incremental report at `reports/mutation/stryker-incremental.json`.',
    });
    expect(text).not.toContain('is partly from the nightly');
    expect(text).not.toContain('--force');
  });

  it('names the files mutated again because the pull request changes tests', () => {
    const touched: PrPlan = {
      skip: false,
      reason: '',
      changed: ['src/core/cache/ETagCacheManager.ts'],
      outOfScope: [],
      directories: ['src/core/cache'],
      mutate: [
        'src/core/cache/ETagCacheManager.ts',
        'src/core/cache/cacheKey.ts',
      ],
      nightly: [],
      retested: ['src/core/cache/cacheKey.ts'],
      force: true,
    };
    const run = report({
      'src/core/cache/ETagCacheManager.ts': ['Killed'],
      'src/core/cache/cacheKey.ts': ['Killed'],
    });
    const { scores, failures } = gatePrRun(run, touched, {
      'src/core/cache': 100,
    });
    const text = renderPrSummary({
      plan: touched,
      scores,
      thresholds: { 'src/core/cache': 100 },
      files: scoreFiles(run, touched.changed),
      undetected: [],
      failures,
      baseline: 'test baseline',
      testFiles: ['tests/tdd/cache/cacheKey.test.ts'],
    });
    expect(text).toContain(
      '`src/core/cache`: 1 unchanged file(s) mutated again because this pull request changes a test that covered them',
    );
    expect(text).toContain('`src/core/cache/cacheKey.ts`');
  });

  it('says how many verdicts it reran instead of claiming --force', () => {
    const precise: PrPlan = {
      skip: false,
      reason: '',
      changed: ['src/core/cache/ETagCacheManager.ts'],
      outOfScope: [],
      directories: ['src/core/cache'],
      mutate: ['src/core/cache/ETagCacheManager.ts'],
      nightly: [],
      retested: [],
      force: false,
      invalidate: ['tests/tdd/core/loggerLevelEnabled.test.ts'],
    };
    const run = report({ 'src/core/cache/ETagCacheManager.ts': ['Killed'] });
    const { scores, failures } = gatePrRun(run, precise, {
      'src/core/cache': 100,
    });
    const text = renderPrSummary({
      plan: precise,
      scores,
      thresholds: { 'src/core/cache': 100 },
      files: scoreFiles(run, precise.changed),
      undetected: [],
      failures,
      baseline: 'test baseline',
      testFiles: ['tests/tdd/core/loggerLevelEnabled.test.ts'],
      invalidated: 7,
    });
    expect(text).toContain(
      'the 7 mutant(s) whose nightly verdict rests on a changed test',
    );
    expect(text).not.toContain('--force');
  });

  it('escapes a replacement that would otherwise break the summary table', () => {
    const mutant = {
      status: 'Survived' as const,
      mutatorName: 'StringLiteral',
      replacement: 'a\\|b `c` |d',
      location: { start: { line: 7, column: 1 } },
    };
    const text = renderPrSummary({
      plan: touched,
      scores: [],
      thresholds: {},
      files: [],
      undetected: [
        {
          file: 'src/core/cache/ETagCacheManager.ts',
          line: 7,
          status: mutant.status,
          mutator: mutant.mutatorName,
          replacement: mutant.replacement,
        },
      ],
      failures: [],
      baseline: 'test baseline',
    });
    expect(text).toContain(
      "| `src/core/cache/ETagCacheManager.ts:7` | Survived | StringLiteral | `a\\\\\\|b 'c' \\|d` |",
    );
  });
});

describe('thresholds file ratchet direction', () => {
  it('rejects a lowered threshold', () => {
    expect(
      thresholdDecreases(
        { 'src/core/cache': 53.3 },
        { 'src/core/cache': 50 },
        'config/mutation/unit-thresholds.json',
      ),
    ).toEqual([
      'config/mutation/unit-thresholds.json: "src/core/cache" was lowered from 53.3% to 50%; ratchets only move up',
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
  const file = 'config/mutation/unit-thresholds.json';

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

/**
 * What a pull request run's outcome means. The distinction the gate turns on
 * is between measuring something worse and measuring nothing: the first is a
 * regression and blocks, the second is an absence and warns. Getting it the
 * other way round would either hide a regression or teach people that a red
 * mutation job is noise, and a gate nobody reads is the failure mode this
 * whole tier exists to prevent.
 */
describe('classifyPrMutationRun', () => {
  it('passes a clean run', () => {
    expect(
      classifyPrMutationRun({ exitCode: 0, hadBaseline: true }).blocking,
    ).toBe(false);
  });

  it('blocks a directory below its floor, baseline or not', () => {
    for (const hadBaseline of [true, false]) {
      const outcome = classifyPrMutationRun({ exitCode: 1, hadBaseline });
      expect(outcome.blocking).toBe(true);
      expect(outcome.message).toContain('below its floor');
    }
  });

  it('blocks a broken check, which cannot say what it compared against', () => {
    expect(
      classifyPrMutationRun({ exitCode: 2, hadBaseline: false }).blocking,
    ).toBe(true);
  });

  it('warns when a cold run runs out of time, having measured nothing', () => {
    const outcome = classifyPrMutationRun({
      exitCode: 124,
      hadBaseline: false,
    });
    expect(outcome.blocking).toBe(false);
    expect(outcome.message).toContain('Nothing was measured');
  });

  it('blocks a timeout that had the baseline, which should have been quick', () => {
    const outcome = classifyPrMutationRun({ exitCode: 124, hadBaseline: true });
    expect(outcome.blocking).toBe(true);
    expect(outcome.message).toContain('not slow');
  });

  it.each([137, 143])('treats signal %i as a kill, not a verdict', (code) => {
    expect(
      classifyPrMutationRun({ exitCode: code, hadBaseline: false }).blocking,
    ).toBe(false);
    expect(
      classifyPrMutationRun({ exitCode: code, hadBaseline: true }).blocking,
    ).toBe(true);
  });

  it('blocks an exit code it does not recognise rather than assuming it is fine', () => {
    const outcome = classifyPrMutationRun({ exitCode: 9, hadBaseline: false });
    expect(outcome.blocking).toBe(true);
    expect(outcome.message).toContain('does not recognise');
  });
});
