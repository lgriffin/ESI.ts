/**
 * Self-tests for the quality trend report (npm run quality:trend): parsing
 * sonarjs's complexity messages, churn, hotspot ranking, and the rendered
 * CSV and Markdown.
 */
import {
  COMPLEXITY_LIMIT,
  TrendPoint,
  churnFromLog,
  churnSince,
  complexityDensity,
  complexityFromMessage,
  optionProblem,
  rankHotspots,
  renderReport,
  summariseComplexity,
  toCsv,
  typeCoverage,
  weeklyCommits,
  xyChart,
} from '../../../scripts/quality/quality-trend-core';

function point(overrides: Partial<TrendPoint> = {}): TrendPoint {
  return {
    sha: 'abcdef12',
    date: '2026-10-08',
    srcFiles: 10,
    srcLines: 2000,
    complexity: 80,
    functionsOverLimit: 1,
    maxFunctionComplexity: 25,
    anyIdentifiers: 5,
    identifiers: 1000,
    eslintDisables: 3,
    lintWarnings: null,
    ...overrides,
  };
}

describe('complexityFromMessage', () => {
  it('reads the function complexity from the sonarjs message', () => {
    expect(
      complexityFromMessage(
        'Refactor this function to reduce its Cognitive Complexity from 27 to the 0 allowed.',
      ),
    ).toBe(27);
    expect(complexityFromMessage('something else')).toBeNull();
  });
});

describe('summariseComplexity', () => {
  it('sums, counts functions over the limit, and keeps the worst', () => {
    expect(
      summariseComplexity([
        { file: 'a.ts', line: 1, complexity: COMPLEXITY_LIMIT },
        { file: 'a.ts', line: 9, complexity: COMPLEXITY_LIMIT + 1 },
        { file: 'b.ts', line: 1, complexity: 3 },
      ]),
    ).toEqual({
      complexity: 2 * COMPLEXITY_LIMIT + 4,
      functionsOverLimit: 1,
      maxFunctionComplexity: COMPLEXITY_LIMIT + 1,
    });
  });
});

describe('hotspots', () => {
  it('counts commits per file from git log --name-only', () => {
    const churn = churnFromLog('src/a.ts\nsrc/b.ts\n\nsrc/a.ts\n');
    expect([...churn]).toEqual([
      ['src/a.ts', 2],
      ['src/b.ts', 1],
    ]);
  });

  it('ranks by churn × complexity and leaves out unchanged files', () => {
    const functions = [
      { file: 'src/a.ts', line: 1, complexity: 10 },
      { file: 'src/a.ts', line: 5, complexity: 30 },
      { file: 'src/b.ts', line: 1, complexity: 50 },
      { file: 'src/c.ts', line: 1, complexity: 99 },
    ];
    const churn = new Map([
      ['src/a.ts', 3],
      ['src/b.ts', 2],
    ]);
    expect(rankHotspots(functions, churn, 10)).toEqual([
      {
        file: 'src/a.ts',
        churn: 3,
        complexity: 40,
        maxFunctionComplexity: 30,
        score: 120,
      },
      {
        file: 'src/b.ts',
        churn: 2,
        complexity: 50,
        maxFunctionComplexity: 50,
        score: 100,
      },
    ]);
    expect(rankHotspots(functions, churn, 1)).toHaveLength(1);
  });
});

describe('derived measures', () => {
  it('computes type coverage and complexity density', () => {
    expect(typeCoverage(point())).toBe(99.5);
    expect(typeCoverage(point({ identifiers: 0, anyIdentifiers: 0 }))).toBe(
      100,
    );
    expect(complexityDensity(point())).toBe(40);
    expect(complexityDensity(point({ srcLines: 0 }))).toBe(0);
  });
});

describe('rendering', () => {
  const points = [
    point({ date: '2026-10-01', sha: '11111111', complexity: 60 }),
    point({ lintWarnings: 470 }),
  ];

  it('writes one CSV row per point with a header', () => {
    const csv = toCsv(points).trim().split('\n');
    expect(csv).toHaveLength(3);
    expect(csv[0]).toContain('complexity_per_kloc');
    expect(csv[1]!.endsWith(',')).toBe(true); // no warning baseline: blank
    expect(csv[2]!.endsWith(',470')).toBe(true);
  });

  it('draws a mermaid line chart GitHub can render', () => {
    expect(xyChart('T', points, (p) => p.complexity)).toContain(
      'x-axis ["10-01", "10-08"]\n  line [60, 80]',
    );
  });

  it('reports the change since the first point', () => {
    const md = renderReport(points, [], [], 90, [
      { file: 'src/a.ts', line: 4, name: 'parsed' },
    ]);
    expect(md).toContain('total cognitive complexity +20');
    expect(md).toContain('`src/a.ts:4` parsed');
  });

  it('says so when nothing was measured', () => {
    expect(renderReport([], [], [], 90)).toContain('No commits were measured');
  });
});

describe('which commits are measured', () => {
  const headTime = Date.parse('2026-10-08T08:00:00Z') / 1000;

  it('measures the ref itself in a one-week run', () => {
    const lookup = jest.fn(() => 'older');
    expect(weeklyCommits('head', headTime, 1, lookup)).toEqual(['head']);
    expect(lookup).not.toHaveBeenCalled();
  });

  it('takes one commit per earlier week, oldest first, without repeats', () => {
    const byCutoff: Record<string, string> = {
      '2026-09-24T08:00:00.000Z': 'a',
      '2026-10-01T08:00:00.000Z': 'a',
    };
    expect(
      weeklyCommits('head', headTime, 3, (d) => byCutoff[d] ?? ''),
    ).toEqual(['a', 'head']);
  });

  it('counts churn back from the ref, not from today', () => {
    expect(churnSince(headTime, 90)).toBe('2026-07-10T08:00:00.000Z');
  });

  it.each([
    [12, 90, null],
    [0, 90, 'positive'],
    [12, 0, 'positive'],
    [12, -5, 'positive'],
    [1.5, 90, 'positive'],
  ])('checks --weeks %p and --churn-days %p', (weeks, days, expected) => {
    const problem = optionProblem(weeks, days);
    if (expected === null) expect(problem).toBeNull();
    else expect(problem).toContain(expected);
  });
});
