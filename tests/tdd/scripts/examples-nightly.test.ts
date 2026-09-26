/**
 * Self-tests for the nightly example run (scripts/examples-core.ts,
 * scripts/examples-strict.cjs).
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
  failureReason,
  issueTitle,
  summarize,
  tierOf,
  uncoveredPublicEndpoints,
  verdictOf,
} from '../../../scripts/examples-core';

const ROOT = path.resolve(__dirname, '../../..');
const EXAMPLES = path.join(ROOT, 'examples');
const exampleFiles = fs
  .readdirSync(EXAMPLES)
  .filter((file) => file.endsWith('.ts'))
  .sort();
const sourceOf = (file: string) =>
  fs.readFileSync(path.join(EXAMPLES, file), 'utf8');

function allEndpoints(): EndpointRef[] {
  const dir = path.join(ROOT, 'src/core/endpoints');
  const refs: EndpointRef[] = [];
  for (const file of fs
    .readdirSync(dir)
    .filter((f) => /Endpoints\.ts$/.test(f))) {
    const mod = require(path.join(dir, file)) as Record<string, unknown>;
    for (const map of Object.values(mod)) {
      if (!map || typeof map !== 'object') continue;
      for (const [name, def] of Object.entries(map)) {
        if (!def || typeof def !== 'object' || !('path' in def)) continue;
        const d = def as {
          path: string;
          method: string;
          requiresAuth?: boolean;
        };
        refs.push({
          name,
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
  const dir = path.join(ROOT, 'src/clients');
  const callers = new Map<string, Set<string>>();
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
    callersFromClientSource(
      fs.readFileSync(path.join(dir, file), 'utf8'),
      callers,
    );
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
    path.join(ROOT, 'scripts/examples-coverage-exceptions.json'),
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

describe('uncoveredPublicEndpoints', () => {
  const endpoints: EndpointRef[] = [
    { name: 'getStatus', path: 'status', method: 'GET', requiresAuth: false },
    {
      name: 'getPrices',
      path: 'markets/prices',
      method: 'GET',
      requiresAuth: false,
    },
    {
      name: 'getWallet',
      path: 'characters/{id}/wallet',
      method: 'GET',
      requiresAuth: true,
    },
  ];
  const callers = new Map([['getPrices', new Set(['getMarketPrices'])]]);

  it('counts an endpoint called by its key, a client method, or a stream helper name', () => {
    expect(
      uncoveredPublicEndpoints(endpoints, callers, [
        'client.status.getStatus()',
        'client.market.getMarketPrices()',
      ]),
    ).toEqual([]);
    expect(
      uncoveredPublicEndpoints(endpoints, callers, [
        "client.status.streamEndpoint('getStatus')",
        'client.market.getMarketPrices()',
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
});

describe('callersFromClientSource', () => {
  it('maps endpoint keys to the methods that call them, generators included', () => {
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
    const callers = callersFromClientSource(source);
    expect([...callers.get('getMarketOrders')!].sort()).toEqual([
      'getMarketOrders',
      'streamMarketOrders',
    ]);
    expect([...callers.get('getMarketTypes')!]).toEqual([
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

describe('scripts/examples-strict.cjs', () => {
  const strict = path.join(ROOT, 'scripts/examples-strict.cjs');
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
