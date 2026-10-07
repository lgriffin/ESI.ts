/**
 * Self-tests for the nightly example run (scripts/docs/examples-core.ts,
 * scripts/docs/examples-strict.cjs).
 *
 * The nightly workflow can only verify what it runs, so the cases over the
 * real repository matter most: every example declares a tier, every example
 * has an npm script, and every public endpoint is called by an example the
 * nightly run executes. The last one is how a new public endpoint gets an
 * example: without one, this suite fails.
 */
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import {
  EndpointRef,
  ExampleResult,
  RUN_TIERS,
  STRICT_EXIT_CODE,
  callersFromClientSource,
  WARM_UP_MS,
  failureReason,
  isOutage,
  issueTitle,
  runTiers,
  summarize,
  tierOf,
  tranquilityReady,
  uncoveredPublicEndpoints,
  verdictOf,
} from '../../../scripts/docs/examples-core';

const ROOT = path.resolve(__dirname, '../../..');
const EXAMPLES = path.join(ROOT, 'examples');
const exampleFiles = fs
  .readdirSync(EXAMPLES)
  .filter((file) => file.endsWith('.ts'))
  .sort();
const sourceOf = (file: string) =>
  fs.readFileSync(path.join(EXAMPLES, file), 'utf8');

/**
 * How each client is reached: the endpoint map a client class passes to
 * `super(client, <map>)`, and the `EsiClient` getter that returns that class.
 */
function clientWiring() {
  const getters = new Map<string, string>();
  const esiClient = fs.readFileSync(
    path.join(ROOT, 'src/EsiClient.ts'),
    'utf8',
  );
  for (const [, getter, cls] of esiClient.matchAll(
    /^ {2}get (\w+)\(\): (\w+) \{/gm,
  )) {
    getters.set(cls!, getter!);
  }
  const dir = path.join(ROOT, 'src/clients');
  const byMap = new Map<string, { getter: string; source: string }>();
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
    const source = fs.readFileSync(path.join(dir, file), 'utf8');
    const cls = /export class (\w+)/.exec(source)?.[1];
    const map = /super\(\s*\w+,\s*(\w+)/.exec(source)?.[1];
    const getter = cls && getters.get(cls);
    if (map && getter) byMap.set(map, { getter, source });
  }
  return byMap;
}

function allEndpoints(): EndpointRef[] {
  const wiring = clientWiring();
  const dir = path.join(ROOT, 'src/core/endpoints');
  const refs: EndpointRef[] = [];
  for (const file of fs
    .readdirSync(dir)
    .filter((f) => /Endpoints\.ts$/.test(f))) {
    const mod = require(path.join(dir, file)) as Record<string, unknown>;
    for (const [mapName, map] of Object.entries(mod)) {
      if (!map || typeof map !== 'object') continue;
      const client = wiring.get(mapName)?.getter;
      for (const [name, def] of Object.entries(map)) {
        if (!def || typeof def !== 'object' || !('path' in def)) continue;
        const d = def as {
          path: string;
          method: string;
          requiresAuth?: boolean;
        };
        refs.push({
          name,
          client: client ?? `<no client for ${mapName}>`,
          path: d.path,
          method: d.method,
          requiresAuth: Boolean(d.requiresAuth),
        });
      }
    }
  }
  return refs;
}

function allCallers(): Map<string, Set<string>> {
  const callers = new Map<string, Set<string>>();
  for (const { getter, source } of clientWiring().values()) {
    callersFromClientSource(source, getter, callers);
  }
  return callers;
}

describe('the examples in examples/', () => {
  it.each(exampleFiles)('%s declares an @nightly tier', (file) => {
    expect(tierOf(sourceOf(file))).not.toBeNull();
  });

  it.each(exampleFiles)('%s has an npm script', (file) => {
    const scripts = Object.values(
      require(path.join(ROOT, 'package.json')).scripts as Record<
        string,
        string
      >,
    );
    expect(scripts).toContain(`ts-node examples/${file}`);
  });

  const exceptions = require(
    path.join(ROOT, 'scripts/docs/examples-coverage-exceptions.json'),
  ) as Record<string, string>;
  const uncovered = () => {
    const nightly = exampleFiles
      .map(sourceOf)
      .filter((source) => RUN_TIERS.includes(tierOf(source)!));
    const endpoints = allEndpoints();
    expect(endpoints.filter((e) => !e.requiresAuth).length).toBeGreaterThan(50);
    return uncoveredPublicEndpoints(endpoints, allCallers(), nightly);
  };

  it('every public endpoint is called by an example the nightly run executes', () => {
    const missing = uncovered().filter((e) => !(e.name in exceptions));
    expect(missing.map((e) => `${e.method} ${e.path} (${e.name})`)).toEqual([]);
  });

  it('every coverage exception is still uncovered', () => {
    const names = uncovered().map((e) => e.name);
    expect(Object.keys(exceptions).filter((n) => !names.includes(n))).toEqual(
      [],
    );
  });
});

describe('tierOf', () => {
  it.each([
    ['/**\n * Status\n *\n * @nightly public\n */', 'public'],
    ['/**\n * @nightly mixed\n */', 'mixed'],
    ['/**\n * @nightly auth\n */', 'auth'],
    ['/**\n * @nightly sde\n */', 'sde'],
  ])('reads the tier from %j', (source, tier) => {
    expect(tierOf(source)).toBe(tier);
  });

  it.each([
    ['/**\n * No tag\n */'],
    ['/**\n * @nightly sometimes\n */'],
    ["const note = 'see @nightly public';"],
  ])('returns null for %j', (source) => {
    expect(tierOf(source)).toBeNull();
  });
});

describe('runTiers', () => {
  it('runs the live tiers, and the sde tier only when an export is on disk', () => {
    expect(runTiers(false)).toEqual(['public', 'mixed']);
    expect(runTiers(true)).toEqual(['public', 'mixed', 'sde']);
  });

  it('narrows to one tier on request, and rejects an unknown one', () => {
    expect(runTiers(true, 'sde')).toEqual(['sde']);
    expect(runTiers(false, 'public')).toEqual(['public']);
    expect(() => runTiers(true, 'nope')).toThrow('Unknown tier nope');
  });
});

describe('uncoveredPublicEndpoints', () => {
  const endpoints: EndpointRef[] = [
    {
      name: 'getStatus',
      client: 'status',
      path: 'status',
      method: 'GET',
      requiresAuth: false,
    },
    {
      name: 'getPrices',
      client: 'market',
      path: 'markets/prices',
      method: 'GET',
      requiresAuth: false,
    },
    {
      name: 'getWallet',
      client: 'wallet',
      path: 'characters/{id}/wallet',
      method: 'GET',
      requiresAuth: true,
    },
  ];
  const callers = new Map([['market.getPrices', new Set(['getMarketPrices'])]]);

  it('counts an endpoint called by its key or by a client method that calls it', () => {
    expect(
      uncoveredPublicEndpoints(endpoints, callers, [
        'client.status.getStatus()',
        'client.market\n    .getMarketPrices()',
      ]),
    ).toEqual([]);
  });

  it('reports a public endpoint no example calls, and ignores authenticated ones', () => {
    expect(
      uncoveredPublicEndpoints(endpoints, callers, [
        'client.status.getStatus()',
      ]).map((e) => e.name),
    ).toEqual(['getPrices']);
  });

  it('does not count a prefix of a longer name', () => {
    expect(
      uncoveredPublicEndpoints(endpoints, callers, [
        'client.status.getStatusHistory()',
        'client.market.getMarketPrices()',
      ]).map((e) => e.name),
    ).toEqual(['getStatus']);
  });

  it('does not count a call through another client with the same key', () => {
    const wars: EndpointRef[] = [
      { ...endpoints[0]!, name: 'getWars', client: 'wars', path: 'wars' },
      {
        ...endpoints[0]!,
        name: 'getWars',
        client: 'factions',
        path: 'fw/wars',
      },
    ];
    expect(
      uncoveredPublicEndpoints(wars, new Map(), ['client.wars.getWars()']).map(
        (e) => e.path,
      ),
    ).toEqual(['fw/wars']);
  });
});

describe('callersFromClientSource', () => {
  it('maps endpoint ids to the methods that call them, generators included', () => {
    const source = [
      'export class MarketClient {',
      '  getMarketOrders(regionId: number) {',
      '    return this.api.getMarketOrders(regionId);',
      '  }',
      '  async *streamMarketOrders(regionId: number) {',
      "    yield* this.streamEndpoint('getMarketOrders', regionId);",
      '  }',
      '  fetchAllMarketTypes<R>(regionId: number) {',
      "    return this.fetchAllEndpoint<R>('getMarketTypes', [regionId]);",
      '  }',
      '}',
    ].join('\n');
    const callers = callersFromClientSource(source, 'market');
    expect([...callers.get('market.getMarketOrders')!].sort()).toEqual([
      'getMarketOrders',
      'streamMarketOrders',
    ]);
    expect([...callers.get('market.getMarketTypes')!]).toEqual([
      'fetchAllMarketTypes',
    ]);
  });
});

describe('verdicts and reporting', () => {
  const result = (over: Partial<ExampleResult>): ExampleResult => ({
    file: 'status.ts',
    exitCode: 0,
    timedOut: false,
    attempts: 1,
    output: '',
    durationMs: 1200,
    ...over,
  });

  it('passes a first-attempt exit 0, and marks a retry-pass flaky', () => {
    expect(verdictOf(result({}))).toBe('passed');
    expect(verdictOf(result({ attempts: 2 }))).toBe('flaky');
  });

  it.each([
    [{ exitCode: 1, attempts: 2 }, 'exited with code 1'],
    [
      { exitCode: STRICT_EXIT_CODE, attempts: 2 },
      'exited 0 but logged an error',
    ],
    [{ exitCode: null, timedOut: true, attempts: 2 }, 'timed out'],
  ])('fails %j as "%s"', (over, reason) => {
    const r = result(over);
    expect(verdictOf(r)).toBe('failed');
    expect(failureReason(r)).toBe(reason);
  });

  // The last lines of the ten examples that failed during the 2026-10-07
  // downtime (issues #594-#603).
  it.each([
    'error: Request failed [error=Bad Gateway: unroutable]',
    'error: Request failed [error=Bad Gateway: Bad Gateway]',
    'error: Request failed [error=Gateway Timeout: Timeout contacting tranquility]',
    'error: Error retrieving character profile [error=ESI server error (502): Bad Gateway: unroutable]',
    'error: Request failed [error=Internal server error, did the request terminate too soon?: Contract system starting up, please try again in a moment]',
    'error: Request failed [error=Internal server error, did the request terminate too soon?: MktMarketOpening, details: {"region": [3, 10000002]}]',
    // A plain 500, as examples/status.ts logs it.
    'error: Failed to get status [error=Internal server error]',
  ])('calls a failure ending "%s" unavailable, not failed', (line) => {
    const r = result({
      exitCode: 1,
      attempts: 2,
      output: `Market Data\nCharacter location unavailable\n${line}`,
    });
    expect(isOutage(r.output)).toBe(true);
    expect(verdictOf(r)).toBe('unavailable');
    expect(failureReason(r)).toBe('Tranquility unavailable');
  });

  it.each([
    'error: Request failed [error=Not Found: Type not found]',
    'error: ZodError: expected number, received string',
    'TypeError: Cannot read properties of undefined',
  ])('keeps a failure ending "%s" failed', (line) => {
    const r = result({ exitCode: 1, attempts: 2, output: line });
    expect(verdictOf(r)).toBe('failed');
  });

  it('judges only the last error line, and never a timeout', () => {
    expect(
      isOutage(
        'error: retrying after Bad Gateway\nerror: ZodError: expected number',
      ),
    ).toBe(false);
    expect(
      verdictOf(
        result({
          exitCode: null,
          timedOut: true,
          attempts: 2,
          output: 'error: Bad Gateway',
        }),
      ),
    ).toBe('failed');
  });

  it('counts unavailable examples apart from passes in the summary', () => {
    const summary = summarize([
      result({}),
      result({
        file: 'industry.ts',
        exitCode: 1,
        attempts: 2,
        output: 'error: Request failed [error=Gateway Timeout: x]',
      }),
    ]);
    expect(summary).toContain('1 of 2 passed.');
    expect(summary).toContain('1 could not run because Tranquility');
    expect(summary).toContain(
      '| `industry.ts` | unavailable | 1.2s | Tranquility unavailable |',
    );
  });

  it('titles the issue after the example file', () => {
    expect(issueTitle('status.ts')).toBe(
      'Nightly example failing: examples/status.ts',
    );
  });

  it('summarizes the run as a table', () => {
    const summary = summarize([
      result({}),
      result({ file: 'wars.ts', exitCode: 1, attempts: 2 }),
    ]);
    expect(summary).toContain('1 of 2 passed.');
    expect(summary).toContain(
      '| `wars.ts` | failed | 1.2s | exited with code 1 |',
    );
  });
});

describe('tranquilityReady', () => {
  const started = '2026-10-07T11:10:00Z';
  const at = (ms: number) => new Date(Date.parse(started) + ms);

  it('waits for Tranquility to answer and warm up', () => {
    const body = { players: 1, server_version: '1', start_time: started };
    expect(tranquilityReady(200, body, at(WARM_UP_MS))).toBe(true);
    expect(tranquilityReady(200, body, at(WARM_UP_MS - 1))).toBe(false);
  });

  it('is not ready on an error, a VIP cluster or a body without start_time', () => {
    const late = at(2 * WARM_UP_MS);
    expect(tranquilityReady(502, null, late)).toBe(false);
    expect(tranquilityReady(503, { start_time: started }, late)).toBe(false);
    expect(
      tranquilityReady(200, { start_time: started, vip: true }, late),
    ).toBe(false);
    expect(tranquilityReady(200, { players: 1 }, late)).toBe(false);
    expect(tranquilityReady(200, { start_time: 'soon' }, late)).toBe(false);
  });
});

describe('scripts/docs/examples-strict.cjs', () => {
  const strict = path.join(ROOT, 'scripts/docs/examples-strict.cjs');
  const run = (code: string) =>
    spawnSync(process.execPath, ['-r', strict, '-e', code], {
      encoding: 'utf8',
    }).status;

  it('turns an exit 0 after console.error into the strict exit code', () => {
    expect(run("console.error('boom')")).toBe(STRICT_EXIT_CODE);
    expect(run("console.error('boom'); process.exit(0)")).toBe(
      STRICT_EXIT_CODE,
    );
  });

  it('keeps a clean exit and an explicit failure code', () => {
    expect(run("console.log('ok')")).toBe(0);
    expect(run("console.error('boom'); process.exit(1)")).toBe(1);
  });
});
