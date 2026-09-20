import {
  MutationReport,
  applyRatchet,
  detectedByEveryRun,
  directoryOf,
  scoreByDirectory,
} from '../../../scripts/mutation-ratchet-core';

function report(files: Record<string, string[]>): MutationReport {
  return {
    files: Object.fromEntries(
      Object.entries(files).map(([file, statuses]) => [
        file,
        { mutants: statuses.map((status) => ({ status })) },
      ]),
    ),
  } as MutationReport;
}

describe('BDD mutation ratchet', () => {
  it.each([
    ['src/clients/MarketClient.ts', 'src/clients'],
    ['src/core/cache/ETagCacheManager.ts', 'src/core/cache'],
    ['src/core/ApiClient.ts', 'src/core'],
    ['src/schemas/market.ts', 'src/schemas'],
    ['src/EsiClient.ts', 'src'],
    [
      'D:\\repo\\src\\core\\rateLimiter\\RateLimiter.ts',
      'src/core/rateLimiter',
    ],
  ])('scores %s under %s', (file, dir) => {
    expect(directoryOf(file)).toBe(dir);
  });

  it('counts killed and timed-out mutants as detected and ignores errors', () => {
    const [score] = scoreByDirectory(
      report({
        'src/clients/A.ts': ['Killed', 'Timeout', 'Survived', 'NoCoverage'],
        'src/clients/B.ts': ['CompileError', 'RuntimeError', 'Ignored'],
      }),
    );
    expect(score).toEqual({
      directory: 'src/clients',
      detected: 2,
      valid: 4,
      score: 50,
    });
  });

  it('rounds down, so a ratchet raised to a result is met by the same result', () => {
    const [score] = scoreByDirectory(
      report({ 'src/a/x.ts': ['Killed', 'Killed', 'Survived'] }),
    );
    expect(score.score).toBe(66.6);
    expect(applyRatchet([score], { 'src/a': 66.6 }).failures).toEqual([]);
  });

  it('fails a directory that drops below its ratchet', () => {
    const scores = scoreByDirectory(
      report({ 'src/clients/A.ts': ['Killed', 'Survived'] }),
    );
    expect(applyRatchet(scores, { 'src/clients': 60 }).failures).toEqual([
      'src/clients: BDD mutation score 50% is below its ratchet of 60%',
    ]);
  });

  it('reports an ungated directory without failing, and raises but never lowers ratchets', () => {
    const scores = scoreByDirectory(
      report({
        'src/clients/A.ts': ['Killed', 'Killed', 'Killed', 'Survived'],
        'src/schemas/s.ts': ['Killed', 'Survived'],
      }),
    );
    const first = applyRatchet(scores, { 'src/clients': 70 });
    expect(first.failures).toEqual([]);
    expect(first.raised).toEqual({ 'src/clients': 75, 'src/schemas': 50 });

    const lower = scoreByDirectory(
      report({ 'src/clients/A.ts': ['Killed', 'Survived'] }),
    );
    const second = applyRatchet(lower, { 'src/clients': 75 });
    expect(second.failures).toHaveLength(1);
    expect(second.raised['src/clients']).toBe(75);
  });

  it('fails when a ratcheted directory disappears from the run', () => {
    const { failures } = applyRatchet([], { 'src/clients': 10 });
    expect(failures).toEqual([
      'src/clients: has a ratchet but no mutants were scored; was it excluded from the run?',
    ]);
  });
});

describe('detectedByEveryRun', () => {
  type Status = MutationReport['files'][string]['mutants'][number]['status'];

  /** One file, one mutant per status, told apart by line. */
  function run(
    statuses: Status[],
    file = 'src/core/cache/C.ts',
  ): MutationReport {
    return {
      files: {
        [file]: {
          mutants: statuses.map((status, index) => ({
            status,
            mutatorName: 'ConditionalExpression',
            replacement: 'true',
            location: {
              start: { line: index + 1, column: 4 },
              end: { line: index + 1, column: 9 },
            },
          })),
        },
      },
    };
  }

  it('counts a mutant as detected only when every run detected it', () => {
    const latest = run(['Killed', 'Timeout', 'Timeout', 'Killed', 'Survived']);
    const earlier = run([
      'Killed',
      'Killed',
      'Survived',
      'NoCoverage',
      'Killed',
    ]);

    const merged = detectedByEveryRun(latest, [earlier]);

    expect(
      merged.files['src/core/cache/C.ts']?.mutants.map((m) => m.status),
    ).toEqual(['Killed', 'Timeout', 'Survived', 'Survived', 'Survived']);
    expect(scoreByDirectory(merged)[0]?.score).toBe(40);
    expect(scoreByDirectory(latest)[0]?.score).toBe(80);
  });

  it('scores no higher than any of the runs it combines', () => {
    const a = run(['Killed', 'Survived', 'Timeout', 'Killed']);
    const b = run(['Survived', 'Killed', 'Killed', 'Killed']);

    const merged = scoreByDirectory(detectedByEveryRun(a, [b]))[0]?.score;

    expect(merged).toBe(50);
    expect(merged).toBeLessThanOrEqual(scoreByDirectory(a)[0]?.score ?? 0);
    expect(merged).toBeLessThanOrEqual(scoreByDirectory(b)[0]?.score ?? 0);
  });

  it('matches mutants by file, place, mutator and replacement, not by position in the list', () => {
    const latest = run(['Killed', 'Killed']);
    const earlier = run(['Survived'], 'src/core/cache/Other.ts');
    const moved: MutationReport = {
      files: {
        'src\\core\\cache\\C.ts': {
          mutants: [
            {
              ...run(['Survived']).files['src/core/cache/C.ts']!.mutants[0]!,
              replacement: 'false',
            },
            run(['Killed', 'Survived']).files['src/core/cache/C.ts']!
              .mutants[1]!,
          ],
        },
      },
    };

    const merged = detectedByEveryRun(latest, [earlier, moved]);

    expect(
      merged.files['src/core/cache/C.ts']?.mutants.map((m) => m.status),
    ).toEqual(['Killed', 'Survived']);
  });

  it('leaves the report alone when there is no earlier run', () => {
    const latest = run(['Killed', 'Survived', 'NoCoverage', 'CompileError']);

    expect(detectedByEveryRun(latest, [])).toEqual(latest);
  });
});
