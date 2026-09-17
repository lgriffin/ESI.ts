/**
 * ETag cache: model-based properties of the request pipeline's caching.
 *
 * Random sequences of calls from several clients sharing one ETag cache,
 * token switches, ESI-side changes, clock advances and (in the second
 * property) faulty responses run against a fake ESI at the fetch seam. A
 * reference model of the cache predicts, for every call, whether a request is
 * sent, which If-None-Match it carries, what the call resolves or rejects
 * with, and the cache entry left behind.
 *
 * The model (guides/ARCHITECTURE.md, tests/bdd/features/core/0050-etag-caching.feature):
 *
 *   key        the URL; for an authenticated endpoint, scoped to the access
 *              token. Only GET responses are cached.
 *   fresh      within the spec TTL of the entry's last store: served with no
 *              request.
 *   retained   past freshness, within spec TTL + 1 hour (5 minutes when the
 *              endpoint has no spec TTL): its ETag is sent as If-None-Match
 *              and it is served stale when ESI answers 5xx.
 *   304        restarts the entry's timestamp, keeps body, ETag and lifetime.
 *   200 + ETag replaces the entry.
 *   200, no ETag  resolves with the new body and leaves the entry as it was.
 *   4xx, network  reject and leave the entry as it was.
 */
import fetchMock from 'jest-fetch-mock';
import * as fc from 'fast-check';

import type { ApiClient } from '../../src/core/ApiClient';
import type { ICache, CacheEntry } from '../../src/core/cache/ICache';
import {
  FakeReply,
  FakeRequest,
  createFakeEsiApiClient,
  installFakeEsi,
  shutdownApiClient,
  useFakeClock,
} from './support/fakeEsi';
import { Pipeline, mutantPipeline, requirePipeline } from './support/pipeline';
import { describeProperty, invariant } from './support/property';

fetchMock.enableMocks();

// ── What the clients call ───────────────────────────────────────────────

const CHARACTER_ID = 90000001;
const REGION_ID = 10000002;
const RETAIN_MS = 60 * 60 * 1000;
const DEFAULT_TTL_MS = 5 * 60 * 1000;

type Identity = 'A' | 'B' | 'none';
const TOKENS: Record<'A' | 'B', string> = {
  A: 'fuzz-token-a',
  B: 'fuzz-token-b',
};

interface RequestKind {
  name: string;
  /** Requests with the same canonical name are the same request to ESI. */
  canonical: string;
  method: 'GET' | 'POST';
  auth: boolean;
  specTtlMs: number | undefined;
  call: (p: Pipeline, api: ApiClient) => Promise<unknown>;
  /** The code the fake ESI encoded into a resolved body. */
  codeOf: (body: unknown) => number;
  body: (code: number) => unknown;
}

const REQUESTS: RequestKind[] = [
  {
    name: 'character wallet (authenticated)',
    canonical: 'wallet',
    method: 'GET',
    auth: true,
    specTtlMs: 120_000,
    call: (p, api) => new p.WalletClient(api).getCharacterWallet(CHARACTER_ID),
    codeOf: (body) => body as number,
    body: (code) => code,
  },
  {
    name: 'server status',
    canonical: 'status',
    method: 'GET',
    auth: false,
    specTtlMs: 30_000,
    call: (p, api) => new p.StatusClient(api).getStatus(),
    codeOf: (body) => (body as { players: number }).players,
    body: (code) => ({
      players: code,
      server_version: '2890123',
      start_time: '2026-09-01T11:00:00Z',
      vip: false,
    }),
  },
  ...[
    ['market history type 34', 'history-34', 34],
    ['market history type 34, id as a string', 'history-34', '34'],
    ['market history type 35', 'history-35', 35],
  ].map(([name, canonical, typeId]): RequestKind => ({
    name: name as string,
    canonical: canonical as string,
    method: 'GET',
    auth: false,
    specTtlMs: undefined,
    call: (p, api) =>
      new p.MarketClient(api).getMarketHistory(REGION_ID, typeId as number),
    codeOf: (body) => (body as Array<{ order_count: number }>)[0]!.order_count,
    body: (code) => [
      {
        date: '2026-09-01',
        order_count: code,
        volume: 1,
        highest: 2,
        average: 1.5,
        lowest: 1,
      },
    ],
  })),
  ...[1, 2].map((id): RequestKind => ({
    name: `POST universe names [${id}]`,
    canonical: `names-${id}`,
    method: 'POST',
    auth: false,
    specTtlMs: undefined,
    call: (p, api) => new p.UniverseClient(api).postNamesAndCategories([id]),
    codeOf: (body) => Number((body as Array<{ name: string }>)[0]!.name),
    body: (code) => [{ id, name: String(code), category: 'character' }],
  })),
];

/** Which canonical request the fake ESI sees. */
function canonicalOf(request: FakeRequest): string | undefined {
  const path = request.url.pathname;
  if (path === `/characters/${CHARACTER_ID}/wallet`) return 'wallet';
  if (path === '/status') return 'status';
  if (path === `/markets/${REGION_ID}/history/`) {
    return `history-${request.url.searchParams.get('type_id')}`;
  }
  if (path === '/universe/names' && request.method === 'POST') {
    return `names-${(JSON.parse(request.body ?? '[]') as number[])[0]}`;
  }
  return undefined;
}

// ── Steps ───────────────────────────────────────────────────────────────

type Fault = 'none' | 'no-etag' | 500 | 503 | 403 | 404 | 'network';

type Step =
  | { kind: 'call'; client: number; request: number; fault: Fault }
  | { kind: 'switch'; token: 'A' | 'B' }
  | { kind: 'change'; owner: 'A' | 'B' | 'public'; canonical: string }
  | { kind: 'advance'; ms: number };

function stepToString(step: Step): string {
  switch (step.kind) {
    case 'call':
      return `call(client ${step.client}, ${REQUESTS[step.request]!.name}${step.fault === 'none' ? '' : `, fault ${step.fault}`})`;
    case 'switch':
      return `switchToken(${step.token})`;
    case 'change':
      return `esiChanges(${step.owner}, ${step.canonical})`;
    case 'advance':
      return `advance(${step.ms}ms)`;
  }
}

const advanceArb = fc.oneof(
  fc.constantFrom(
    1_000,
    29_000,
    31_000,
    119_000,
    121_000,
    299_000,
    301_000,
    RETAIN_MS,
    RETAIN_MS + 121_000,
  ),
  fc.integer({ min: 0, max: RETAIN_MS + 200_000 }),
);

function stepsArb(faults: boolean): fc.Arbitrary<Step[]> {
  const fault: fc.Arbitrary<Fault> = faults
    ? fc.oneof(
        { arbitrary: fc.constant('none' as const), weight: 3 },
        {
          arbitrary: fc.constantFrom<Fault>(
            'no-etag',
            500,
            503,
            403,
            404,
            'network',
          ),
          weight: 2,
        },
      )
    : fc.constant('none');
  const step: fc.Arbitrary<Step> = fc.oneof(
    {
      arbitrary: fc.record({
        kind: fc.constant('call' as const),
        client: fc.integer({ min: 0, max: 3 }),
        request: fc.integer({ min: 0, max: REQUESTS.length - 1 }),
        fault,
      }),
      weight: 6,
    },
    {
      arbitrary: fc.record({
        kind: fc.constant('switch' as const),
        token: fc.constantFrom('A' as const, 'B' as const),
      }),
      weight: 1,
    },
    {
      arbitrary: fc.record({
        kind: fc.constant('change' as const),
        owner: fc.constantFrom('A' as const, 'B' as const, 'public' as const),
        canonical: fc.constantFrom(
          ...new Set(REQUESTS.map((r) => r.canonical)),
        ),
      }),
      weight: 1,
    },
    {
      arbitrary: fc.record({
        kind: fc.constant('advance' as const),
        ms: advanceArb,
      }),
      weight: 2,
    },
  );
  return fc.array(step, { minLength: 1, maxLength: 30 }).map((steps) =>
    Object.assign(steps, {
      [fc.toStringMethod]: () => `[${steps.map(stepToString).join(', ')}]`,
    }),
  );
}

// ── Model ───────────────────────────────────────────────────────────────

interface ModelEntry {
  etag: string;
  code: number;
  storedAt: number;
  lifetime: number;
}

class FakeEsiState {
  private versions = new Map<string, number>();
  private codes = new Map<string, number>();
  readonly decode = new Map<number, string>();

  current(owner: string, canonical: string): { code: number; etag: string } {
    const resource = `${owner}|${canonical}`;
    const version = this.versions.get(resource) ?? 0;
    const id = `${resource}|v${version}`;
    let code = this.codes.get(id);
    if (code === undefined) {
      code = this.codes.size + 1;
      this.codes.set(id, code);
      this.decode.set(code, id);
    }
    return { code, etag: `"etag-${code}"` };
  }

  change(owner: string, canonical: string): void {
    const resource = `${owner}|${canonical}`;
    this.versions.set(resource, (this.versions.get(resource) ?? 0) + 1);
  }
}

// ── The property ────────────────────────────────────────────────────────

type CacheWrapper = (cache: ICache) => ICache;

interface Subject {
  pipeline: Pipeline;
  wrapCache: CacheWrapper;
}

function cacheModelProperty(faults: boolean) {
  return (subject: Subject) =>
    fc.asyncProperty(stepsArb(faults), async (steps) => {
      const p = subject.pipeline;
      const esi = new FakeEsiState();
      let pendingFault: Fault = 'none';
      const identityOf = (request: FakeRequest): Identity => {
        const auth = request.headers.authorization;
        if (auth === `Bearer ${TOKENS.A}`) return 'A';
        if (auth === `Bearer ${TOKENS.B}`) return 'B';
        return 'none';
      };
      const requests = installFakeEsi((request): FakeReply => {
        const canonical = canonicalOf(request);
        const kind = REQUESTS.find((r) => r.canonical === canonical);
        if (!kind) return { status: 404, body: { error: 'unknown route' } };
        const identity = identityOf(request);
        if (kind.auth && identity === 'none')
          return { status: 401, body: { error: 'token is not valid' } };
        const fault = pendingFault;
        if (fault === 'network') return { networkError: true };
        if (typeof fault === 'number')
          return { status: fault, body: { error: 'fake fault' } };
        const { code, etag } = esi.current(
          kind.auth ? identity : 'public',
          kind.canonical,
        );
        if (
          fault !== 'no-etag' &&
          kind.method === 'GET' &&
          request.headers['if-none-match'] === etag
        ) {
          return { status: 304, headers: { etag } };
        }
        return {
          status: 200,
          headers: fault === 'no-etag' || kind.method !== 'GET' ? {} : { etag },
          body: kind.body(code),
        };
      });

      const { clock, restore } = useFakeClock();
      const cache = subject.wrapCache(new p.ETagCacheManager());
      const tokens: Array<'A' | 'B' | undefined> = ['A', 'B', undefined, 'A'];
      const clients = tokens.map((token) => {
        const api = createFakeEsiApiClient(p, token && TOKENS[token], {
          enableETagCache: false,
          retryConfig: { maxRetries: 0 },
        });
        api.setCache(cache);
        return api;
      });
      const model = new Map<string, ModelEntry>();

      try {
        for (const [index, step] of steps.entries()) {
          const at = `step ${index + 1} ${stepToString(step)}`;
          if (step.kind === 'advance') {
            clock.now += step.ms;
            continue;
          }
          if (step.kind === 'switch') {
            tokens[3] = step.token;
            clients[3]!.setAccessToken(TOKENS[step.token]);
            continue;
          }
          if (step.kind === 'change') {
            esi.change(step.owner, step.canonical);
            continue;
          }

          const kind = REQUESTS[step.request]!;
          const token = tokens[step.client];
          const identity: Identity = token ?? 'none';
          const owner = kind.auth ? identity : 'public';
          const modelKey =
            kind.auth && identity !== 'none'
              ? `${identity}|${kind.canonical}`
              : `url|${kind.canonical}`;
          const now = clock.now;

          let entry = kind.method === 'GET' ? model.get(modelKey) : undefined;
          if (entry && now - entry.storedAt > entry.lifetime) {
            model.delete(modelKey);
            entry = undefined;
          }

          // Predict.
          let expectRequest = true;
          let expectCode: number | undefined;
          let expectStatus: number | undefined;
          let expectIfNoneMatch: string | undefined;
          let expectNoToken = false;
          if (kind.auth && identity === 'none') {
            // buildRequestHeaders refuses before anything is sent.
            expectRequest = false;
            expectNoToken = true;
          } else if (
            kind.method === 'GET' &&
            kind.specTtlMs !== undefined &&
            entry &&
            now - entry.storedAt < kind.specTtlMs
          ) {
            expectRequest = false;
            expectCode = entry.code;
          } else {
            expectIfNoneMatch = entry?.etag;
            pendingFault = step.fault;
            const current = esi.current(owner, kind.canonical);
            if (step.fault === 'network') {
              expectStatus = 0;
            } else if (typeof step.fault === 'number') {
              if (step.fault >= 500 && entry) expectCode = entry.code;
              else expectStatus = step.fault;
            } else if (
              kind.method === 'GET' &&
              step.fault === 'none' &&
              entry?.etag === current.etag
            ) {
              expectCode = entry.code;
              entry.storedAt = now;
            } else {
              expectCode = current.code;
              if (kind.method === 'GET' && step.fault === 'none') {
                const lifetime =
                  kind.specTtlMs !== undefined
                    ? kind.specTtlMs + RETAIN_MS
                    : DEFAULT_TTL_MS;
                model.set(modelKey, {
                  etag: current.etag,
                  code: current.code,
                  storedAt: now,
                  lifetime,
                });
              }
            }
          }

          // Act.
          const before = requests.length;
          let resolved: unknown;
          let rejected: unknown;
          let didReject = false;
          try {
            resolved = await kind.call(p, clients[step.client]!);
          } catch (error) {
            didReject = true;
            rejected = error;
          }
          pendingFault = 'none';
          const sent = requests.slice(before);

          // Check.
          invariant(
            sent.length === (expectRequest ? 1 : 0),
            `${at}: sent ${sent.length} requests, expected ${expectRequest ? 1 : 0}${expectRequest ? '' : ' (entry is within its spec TTL)'}`,
          );
          if (expectRequest) {
            const ifNoneMatch = sent[0]!.headers['if-none-match'];
            invariant(
              ifNoneMatch === expectIfNoneMatch,
              `${at}: If-None-Match was ${String(ifNoneMatch)}, expected ${String(expectIfNoneMatch)}`,
            );
          }
          if (expectNoToken) {
            invariant(
              didReject && String(rejected).includes('NO_AUTH_TOKEN'),
              `${at}: an authenticated call without a token should reject with NO_AUTH_TOKEN, got ${didReject ? String(rejected) : 'a resolution'}`,
            );
          } else if (expectStatus !== undefined) {
            const status = (rejected as { statusCode?: unknown } | undefined)
              ?.statusCode;
            invariant(
              didReject && status === expectStatus,
              `${at}: expected a rejection with status ${expectStatus}, got ${didReject ? `a rejection with ${String(status)}: ${String(rejected)}` : `a resolution with ${esi.decode.get(kind.codeOf(resolved)) ?? JSON.stringify(resolved)}`}`,
            );
          } else {
            invariant(
              !didReject,
              `${at}: expected a resolution, got a rejection: ${String(rejected)}`,
            );
            const code = kind.codeOf(resolved);
            invariant(
              code === expectCode,
              `${at}: resolved with ${esi.decode.get(code) ?? String(code)}, expected ${esi.decode.get(expectCode!) ?? String(expectCode)}`,
            );
          }

          // The entry the cache holds for this request, if the model has one.
          if (kind.method === 'GET' && !(kind.auth && identity === 'none')) {
            const expected = model.get(modelKey);
            const url = `https://esi.evetech.net/${sentPathOf(kind)}`;
            const actual: CacheEntry | null = cache.get(
              p.buildCacheKey(url, clients[step.client]!, kind.auth),
            );
            if (expected && now - expected.storedAt <= expected.lifetime) {
              invariant(
                actual !== null &&
                  actual.etag === expected.etag &&
                  kind.codeOf(actual.data) === expected.code &&
                  actual.timestamp === expected.storedAt &&
                  actual.ttl === expected.lifetime,
                `${at}: cache holds ${actual ? `etag ${actual.etag}, ${esi.decode.get(kind.codeOf(actual.data))}, stored at ${actual.timestamp}, lifetime ${String(actual.ttl)}` : 'no entry'}; expected etag ${expected.etag}, ${esi.decode.get(expected.code)}, stored at ${expected.storedAt}, lifetime ${expected.lifetime}`,
              );
            } else {
              invariant(
                actual === null,
                `${at}: cache holds an entry (etag ${actual?.etag}) where the model has none`,
              );
            }
          }
        }
      } finally {
        restore();
        for (const api of clients) shutdownApiClient(api);
      }
    });
}

/** The resolved path each request kind is sent to. */
function sentPathOf(kind: RequestKind): string {
  if (kind.canonical === 'wallet') return `characters/${CHARACTER_ID}/wallet`;
  if (kind.canonical === 'status') return 'status';
  if (kind.canonical.startsWith('history-')) {
    return `markets/${REGION_ID}/history/?type_id=${kind.canonical.slice('history-'.length)}`;
  }
  return 'universe/names';
}

// ── Subjects ────────────────────────────────────────────────────────────

const realSubject = (): Subject => ({
  pipeline: requirePipeline(),
  wrapCache: (cache) => cache,
});

/** An ICache that forwards everything except what `overrides` replaces. */
function wrapped(overrides: (cache: ICache) => Partial<ICache>): CacheWrapper {
  return (cache) => {
    const replaced = overrides(cache);
    return new Proxy(cache, {
      get(target, prop, receiver) {
        if (prop in replaced) return replaced[prop as keyof ICache];
        const value = Reflect.get(target, prop, receiver) as unknown;
        return typeof value === 'function'
          ? (value as (...args: unknown[]) => unknown).bind(target)
          : value;
      },
    });
  };
}

const withCache = (wrapCache: CacheWrapper) => (): Subject => ({
  pipeline: requirePipeline(),
  wrapCache,
});

const stripTokenScope = (key: string) => key.replace(/^[0-9a-f]{16}:/, '');

describeProperty<Subject>({
  name: 'the ETag cache serves each response only to the identity and request it was fetched for',
  file: __filename,
  subject: realSubject,
  mutants: {
    'cache key ignores the access token': withCache(
      wrapped((cache) => ({
        get: (key) => cache.get(stripTokenScope(key)),
        getETag: (key) => cache.getETag(stripTokenScope(key)),
        set: (key, ...rest) => cache.set(stripTokenScope(key), ...rest),
      })),
    ),
    'cache key is not deterministic': withCache(
      wrapped((cache) => {
        let writes = 0;
        return {
          set: (key, ...rest) => cache.set(`${key}#${writes++}`, ...rest),
        };
      }),
    ),
    'cache key ignores the query string': withCache(
      wrapped((cache) => {
        const strip = (key: string) => key.split('?')[0]!;
        return {
          get: (key) => cache.get(strip(key)),
          getETag: (key) => cache.getETag(strip(key)),
          set: (key, ...rest) => cache.set(strip(key), ...rest),
        };
      }),
    ),
  },
  property: cacheModelProperty(false),
  timeoutMs: 120_000,
});

describeProperty<Subject>({
  name: 'the ETag cache ends every exchange in the state the caching rules give',
  file: __filename,
  subject: realSubject,
  mutants: {
    '304 does not restart the freshness TTL': withCache(
      wrapped((cache) => ({
        set: (key, etag, data, headers, ttl) => {
          const existing = cache.get(key);
          if (existing && existing.etag === etag && existing.data === data)
            return;
          cache.set(key, etag, data, headers, ttl);
        },
      })),
    ),
    'a 5xx evicts the cached entry': () => ({
      pipeline: mutantPipeline(() => {
        jest.doMock('../../src/core/requestPipeline/statusHandling', () => {
          const actual = jest.requireActual<
            typeof import('../../src/core/requestPipeline/statusHandling')
          >('../../src/core/requestPipeline/statusHandling');
          const { buildCacheKey } = jest.requireActual<
            typeof import('../../src/core/cache/cacheKey')
          >('../../src/core/cache/cacheKey');
          return {
            ...actual,
            handleErrorResponse: (
              client: ApiClient,
              response: Response,
              url: string,
              parsed: unknown,
              useETag: boolean,
              resolveCache: (c: ApiClient) => ICache | null,
              requiresAuth = false,
              reason?: string,
            ) => {
              if (response.status >= 500)
                resolveCache(client)?.delete(
                  buildCacheKey(url, client, requiresAuth),
                );
              return (
                actual.handleErrorResponse as (...args: unknown[]) => unknown
              )(
                client,
                response,
                url,
                parsed,
                useETag,
                resolveCache,
                requiresAuth,
                reason,
              );
            },
          };
        });
      })(),
      wrapCache: (cache) => cache,
    }),
    'a 200 without ETag drops the cached entry': () => ({
      pipeline: mutantPipeline(() => {
        jest.doMock('../../src/core/requestPipeline/cachePolicy', () => {
          const actual = jest.requireActual<
            typeof import('../../src/core/requestPipeline/cachePolicy')
          >('../../src/core/requestPipeline/cachePolicy');
          const { buildCacheKey } = jest.requireActual<
            typeof import('../../src/core/cache/cacheKey')
          >('../../src/core/cache/cacheKey');
          return {
            ...actual,
            cacheResponse: (
              ...args: Parameters<typeof actual.cacheResponse>
            ) => {
              const [
                client,
                url,
                ,
                ,
                parsed,
                ,
                ,
                resolveCache,
                ,
                requiresAuth,
              ] = args;
              if (!parsed.etag)
                resolveCache(client)?.delete(
                  buildCacheKey(url, client, requiresAuth),
                );
              return actual.cacheResponse(...args);
            },
          };
        });
      })(),
      wrapCache: (cache) => cache,
    }),
  },
  property: cacheModelProperty(true),
  timeoutMs: 120_000,
});
