/**
 * Self-tests for the documentation metrics (scripts/docs/doc-metrics-core.ts),
 * CHARTER DOC-04: the counting, the marker rewrite, and the check that
 * `npm run docs:metrics -- --check` and `validate:versions` run.
 */
import {
  METRIC_NAMES,
  Metrics,
  checkDocs,
  compatibilityDateOf,
  computeMetrics,
  countCharter,
  countFeatures,
  countRoutes,
  countStreams,
  countTestFiles,
  formatMetricsJson,
  formatProblems,
  formatValue,
  maskCode,
  rewriteMarkers,
} from '../../../scripts/docs/doc-metrics-core';

function metrics(overrides: Partial<Metrics> = {}): Metrics {
  const base = Object.fromEntries(
    METRIC_NAMES.map((name) => [name, 0]),
  ) as unknown as Metrics;
  return {
    ...base,
    version: '1.2.3',
    compatibilityDate: '2026-01-01',
    ...overrides,
  };
}

const FEATURE = `Feature: Status
  The status endpoint.

  Rule: The client shall return the server status.

    Scenario: Status is returned
      Given ESI is up
      When the status is requested
      Then it is returned

    Scenario Outline: Players are counted
      Given <n> players
      Then the count is <n>

      Examples:
        | n |
        | 1 |
        | 2 |

  Rule: The client shall reject a malformed status.

    Scenario: A malformed status is rejected
      Given a malformed status
      Then it is rejected
`;

describe('counting', () => {
  it('counts Rules, and a Scenario Outline once however many examples it has', () => {
    expect(countFeatures([{ file: 'a.feature', source: FEATURE }])).toEqual({
      requirements: 2,
      plainScenarios: 2,
      scenarioOutlines: 1,
    });
  });

  it('counts a route once when two maps define it or only its parameter name or trailing slash differs', () => {
    expect(
      countRoutes([
        { method: 'GET', path: '/universe/schematics/{schematic_id}/' },
        { method: 'GET', path: '/universe/schematics/{id}' },
        { method: 'POST', path: '/universe/names/' },
        { method: 'GET', path: '/status' },
      ]),
    ).toEqual({ routes: 3, trailingSlashRoutes: 2 });
  });

  it('counts stream* methods and the clients that declare any', () => {
    expect(
      countStreams([
        { client: 'A', methods: ['constructor', 'streamX', 'streamY', 'getX'] },
        { client: 'B', methods: ['constructor', 'streaming', 'getY'] },
        { client: 'C', methods: ['streamZ'] },
      ]),
    ).toEqual({ streamMethods: 3, streamClients: 2 });
  });

  it('counts each test file once, by the tier its Jest configuration matches', () => {
    const counts = countTestFiles([
      'tests/tdd/core/a.test.ts',
      'tests/tdd/composition/b.test.ts',
      'tests/tdd/spec-audit/fixtures/tests/bdd/specs/x.spec.ts',
      'tests/bdd/specs/core/0001-status.spec.ts',
      'tests/bdd/step-definitions/core/wallet.steps.ts',
      'tests/faults/catalogue.test.ts',
      'tests/faults/soak.nightly.test.ts',
      'tests/contract/replay/harness.test.ts',
      'tests/contract/esi-contract.test.ts',
      'tests/typetests/client.test-d.ts',
      'tests/contract/helpers.ts',
    ]);
    expect(counts).toMatchObject({
      unitSuites: 1,
      compositionSuites: 1,
      bddSuites: 2,
      faultSuites: 1,
      faultNightlySuites: 1,
      replaySuites: 1,
      contractSuites: 1,
      typeTestFiles: 1,
      testFiles: 9,
    });
  });

  it('counts charter requirements by status', () => {
    const charter = [
      '#### DOC-01 · Ubiquitous · Enforced',
      '',
      'The docs **shall** exist.',
      '',
      '#### DOC-02 · Ubiquitous · Gap',
      '',
      'The docs **shall** be right.',
    ].join('\n');
    expect(countCharter(charter)).toEqual({
      charterRequirements: 2,
      charterEnforced: 1,
      charterPractised: 0,
      charterPartial: 0,
      charterGap: 1,
    });
  });

  it('reads the compatibility date and fails without one', () => {
    expect(
      compatibilityDateOf("export const COMPATIBILITY_DATE = '2026-08-18';"),
    ).toBe('2026-08-18');
    expect(() => compatibilityDateOf('')).toThrow(/COMPATIBILITY_DATE/);
  });

  it('counts clients without BaseEsiClient, and schema modules without the shared files', () => {
    const m = computeMetrics({
      packageVersion: '1.0.0',
      constantsSource: "COMPATIBILITY_DATE = '2026-01-01'",
      files: [
        'src/clients/BaseEsiClient.ts',
        'src/clients/ClientRegistry.ts',
        'src/clients/StatusClient.ts',
        'src/clients/WalletClient.ts',
        'src/schemas/index.ts',
        'src/schemas/common.ts',
        'src/schemas/status.ts',
        'examples/status.ts',
        'examples/README.md',
      ],
      endpoints: [],
      operations: 7,
      clients: [],
      features: [
        { file: 'tests/bdd/features/core/status.feature', source: FEATURE },
      ],
      charter: '',
    });
    expect(m).toMatchObject({
      clients: 2,
      schemaModules: 1,
      examples: 1,
      operations: 7,
      featureFiles: 1,
      featureFilesCore: 1,
      requirements: 2,
      scenarios: 3,
    });
    expect(Object.keys(m)).toEqual([...METRIC_NAMES]);
  });
});

describe('formatting', () => {
  it('writes numbers the way the prose does', () => {
    expect(formatValue(39)).toBe('39');
    expect(formatValue(7198)).toBe('7,198');
    expect(formatValue('2026-08-18')).toBe('2026-08-18');
  });

  it('writes the JSON in METRIC_NAMES order with a trailing newline', () => {
    const json = formatMetricsJson(metrics({ clients: 39 }));
    expect(json.endsWith('}\n')).toBe(true);
    expect(Object.keys(JSON.parse(json) as object)).toEqual([...METRIC_NAMES]);
  });
});

describe('rewriteMarkers', () => {
  const m = metrics({ clients: 39, routes: 1235 });

  it('replaces a stale value and reports where', () => {
    const result = rewriteMarkers(
      'Intro\nThe <!-- metric:clients -->33<!-- /metric --> clients.\n',
      m,
    );
    expect(result.text).toBe(
      'Intro\nThe <!-- metric:clients -->39<!-- /metric --> clients.\n',
    );
    expect(result.changes).toEqual([
      { metric: 'clients', line: 2, from: '33', to: '39' },
    ]);
    expect(result.errors).toEqual([]);
  });

  it('leaves a current value alone and keeps markers inside a table cell', () => {
    const text = '| Routes | <!-- metric:routes -->1,235<!-- /metric --> |\n';
    const result = rewriteMarkers(text, m);
    expect(result.text).toBe(text);
    expect(result.changes).toEqual([]);
  });

  it('rejects an unknown metric name', () => {
    const result = rewriteMarkers(
      'The <!-- metric:clientz -->39<!-- /metric --> clients.',
      m,
    );
    expect(result.errors).toEqual([
      { line: 1, message: 'unknown metric "clientz"' },
    ]);
  });

  it('rejects a marker with no closing marker, or split over two lines', () => {
    const result = rewriteMarkers(
      'The <!-- metric:clients -->39 clients.\nAnd <!-- metric:routes -->\n1<!-- /metric -->\n',
      m,
    );
    expect(result.errors.map((e) => e.line)).toEqual([1, 2, 3]);
    expect(result.errors[0]!.message).toMatch(/malformed metric marker/);
  });

  it('rejects a marker at the start of a line, where Markdown reads an HTML block', () => {
    const result = rewriteMarkers(
      '<!-- metric:clients -->39<!-- /metric --> clients.',
      m,
    );
    expect(result.errors[0]!.message).toMatch(/starts a line/);
  });

  it('ignores markers written as examples in code', () => {
    const text = [
      'Write `<!-- metric:name -->value<!-- /metric -->` to mark a count.',
      '```md',
      '<!-- metric:bogus -->1<!-- /metric -->',
      '```',
    ].join('\n');
    expect(maskCode(text).includes('metric')).toBe(false);
    expect(rewriteMarkers(text, m)).toEqual({
      text,
      changes: [],
      errors: [],
    });
  });
});

describe('checkDocs', () => {
  const m = metrics({ clients: 39 });
  const json = formatMetricsJson(m);

  it('passes when every marked value and the JSON are current', () => {
    const report = checkDocs(
      [
        {
          path: 'README.md',
          text: 'A <!-- metric:clients -->39<!-- /metric -->',
        },
      ],
      m,
      json,
    );
    expect(formatProblems(report)).toEqual([]);
  });

  it('names each stale file and metric, and a stale JSON', () => {
    const report = checkDocs(
      [
        {
          path: 'README.md',
          text: 'A <!-- metric:clients -->39<!-- /metric -->',
        },
        {
          path: 'guides/USAGE.md',
          text: 'x\nAll <!-- metric:clients -->37<!-- /metric -->',
        },
      ],
      m,
      formatMetricsJson(metrics({ clients: 37 })),
    );
    expect(formatProblems(report)).toEqual([
      'guides/USAGE.md:2: clients is 39, the text says 37',
      'etc/doc-metrics.json is stale',
    ]);
    expect(report.rewritten).toEqual([
      {
        path: 'guides/USAGE.md',
        text: 'x\nAll <!-- metric:clients -->39<!-- /metric -->',
      },
    ]);
  });

  it('reads a missing JSON file as stale, and ignores whitespace in it', () => {
    expect(checkDocs([], m, null).staleJson).toBe(true);
    expect(checkDocs([], m, JSON.stringify(JSON.parse(json))).staleJson).toBe(
      false,
    );
  });

  it('reports marker errors with their file', () => {
    const report = checkDocs(
      [
        {
          path: 'guides/A.md',
          text: 'A <!-- metric:nope -->1<!-- /metric -->',
        },
      ],
      m,
      json,
    );
    expect(formatProblems(report)).toEqual([
      'guides/A.md:1: unknown metric "nope"',
    ]);
  });
});
