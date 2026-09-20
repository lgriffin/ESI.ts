/**
 * The micro-benchmark catalogue: the per-request paths a client pays for on
 * every call. Each task builds its state once in `setup` and returns the
 * closure the harness times, so setup cost never lands in a sample.
 *
 * Task names are the keys the comparison matches base and candidate runs by.
 * Renaming one starts a new series with no baseline; keep them stable.
 *
 * Everything imports from `../../src` by relative path. `scripts/bench-ab.ts`
 * copies this directory into the base tree and bundles it there, so the same
 * harness measures both sides of a pull request.
 */
import { z } from 'zod';
import { ApiClient, FetchLike } from '../../src/core/ApiClient';
import { configureApiClient } from '../../src/core/configureApiClient';
import { batchFetch } from '../../src/core/BatchRequestHandler';
import { ETagCacheManager } from '../../src/core/cache/ETagCacheManager';
import { buildCacheKey } from '../../src/core/cache/cacheKey';
import { CircuitBreaker } from '../../src/core/circuitBreaker/CircuitBreaker';
import { characterEndpoints } from '../../src/core/endpoints/characterEndpoints';
import { marketEndpoints } from '../../src/core/endpoints/marketEndpoints';
import { piEndpoints } from '../../src/core/endpoints/piEndpoints';
import { createNoopLogger } from '../../src/core/logger/NoopLogger';
import { RateLimiter } from '../../src/core/rateLimiter/RateLimiter';
import { lookupSpecTtl } from '../../src/core/requestPipeline/cachePolicy';
import { parseCacheControlTtl } from '../../src/core/requestPipeline/headers';
import { parseHeaders } from '../../src/core/util/headersUtil';
import { CharacterClient } from '../../src/clients/CharacterClient';
import { MarketClient } from '../../src/clients/MarketClient';
import {
  ESI_RESPONSE_HEADERS,
  characterInfo,
  colonyLayout,
  marketOrders,
} from './fixtures';

export interface BenchTask {
  /** Stable identifier, `<area>/<what>`. */
  name: string;
  /** Build state and return the function to time. */
  setup(): Promise<Measured> | Measured;
}

export interface Measured {
  fn: () => unknown;
  teardown?: () => void;
}

const BASE_URL = 'https://esi.evetech.net';
const ORDERS_TEMPLATE = 'markets/{regionId}/orders/';

/** Keys cycle through a fixed set so batched iterations stay allocation-free. */
function cycle<T>(values: readonly T[]): () => T {
  let i = 0;
  return () => {
    const value = values[i]!;
    i = (i + 1) % values.length;
    return value;
  };
}

function schemaTask(
  name: string,
  schema: z.ZodType,
  payload: unknown,
): BenchTask {
  return {
    name,
    setup() {
      // ESI hands the client text; the pipeline parses it, then validates.
      const text = JSON.stringify(payload);
      if (!schema.safeParse(JSON.parse(text)).success) {
        throw new Error(`${name}: fixture does not satisfy its schema`);
      }
      return {
        fn: () => schema.safeParse(JSON.parse(text)),
      };
    },
  };
}

function cacheWithEntries(maxEntries: number, count: number) {
  const cache = new ETagCacheManager({ maxEntries });
  const urls = Array.from(
    { length: count },
    (_, i) => `${BASE_URL}/characters/${90_000_000 + i}/`,
  );
  const body = characterInfo(90_000_000);
  for (const url of urls) {
    cache.set(url, '"etag"', body, ESI_RESPONSE_HEADERS);
  }
  return { cache, urls, body };
}

/**
 * A fetch that answers instantly from pre-encoded text, so a pipeline task
 * measures the client and not a network. The `Response` is built per call
 * because the pipeline consumes its body.
 */
function instantFetch(
  body: string,
  headers: Record<string, string>,
): FetchLike {
  return () => Promise.resolve(new Response(body, { status: 200, headers }));
}

/**
 * The client pipeline as `EsiClient` wires it (rate limiter, deduplication,
 * ETag cache, retry, validation) with request spacing off and no logging.
 * Responses carry no ETag, so nothing is served from the cache and every
 * call runs the full request path.
 */
function pipelineClient(fetch: FetchLike): ApiClient {
  const api = new ApiClient('esi-ts-bench', BASE_URL);
  configureApiClient(api, {
    rateLimiterConfig: { minDelayMs: 0 },
    logger: createNoopLogger(),
  });
  api.setFetch(fetch);
  return api;
}

function shutdownPipeline(api: ApiClient): void {
  const cache = api.getCache();
  if (cache instanceof ETagCacheManager) cache.shutdown();
}

const PIPELINE_HEADERS = {
  'content-type': 'application/json; charset=UTF-8',
  'x-pages': '1',
  'x-esi-error-limit-remain': '100',
  'x-esi-error-limit-reset': '42',
};

export const tasks: BenchTask[] = [
  // ── Parse + validate, per endpoint family ─────────────────────────────
  schemaTask(
    'schema/small-object: character public info',
    characterEndpoints.getCharacterPublicInfo.responseSchema,
    characterInfo(2114794365),
  ),
  schemaTask(
    'schema/large-array: 1000 region market orders',
    marketEndpoints.getMarketOrders.responseSchema,
    marketOrders(1000),
  ),
  schemaTask(
    'schema/nested: colony layout, 40 pins',
    piEndpoints.getColonyLayout.responseSchema,
    colonyLayout(40),
  ),

  // ── ETag cache ────────────────────────────────────────────────────────
  {
    name: 'cache/get hit, 1000 entries',
    setup() {
      const { cache, urls } = cacheWithEntries(1000, 1000);
      const next = cycle(urls);
      return { fn: () => cache.get(next()), teardown: () => cache.shutdown() };
    },
  },
  {
    name: 'cache/get miss, 1000 entries',
    setup() {
      const { cache } = cacheWithEntries(1000, 1000);
      const next = cycle(
        Array.from({ length: 1000 }, (_, i) => `${BASE_URL}/absent/${i}/`),
      );
      return { fn: () => cache.get(next()), teardown: () => cache.shutdown() };
    },
  },
  {
    name: 'cache/set replacing a stored entry',
    setup() {
      const { cache, urls, body } = cacheWithEntries(1000, 1000);
      const next = cycle(urls);
      return {
        fn: () => cache.set(next(), '"etag-2"', body, ESI_RESPONSE_HEADERS),
        teardown: () => cache.shutdown(),
      };
    },
  },
  {
    name: 'cache/set at capacity, evicting the oldest of 1000',
    setup() {
      const { cache, body } = cacheWithEntries(1000, 1000);
      // More keys than the cache holds, so every set inserts and evicts.
      const next = cycle(
        Array.from({ length: 8192 }, (_, i) => `${BASE_URL}/new/${i}/`),
      );
      return {
        fn: () => cache.set(next(), '"etag"', body, ESI_RESPONSE_HEADERS),
        teardown: () => cache.shutdown(),
      };
    },
  },

  // ── Cache keys and cache policy ───────────────────────────────────────
  {
    name: 'cache-key/authenticated endpoint (token hash)',
    setup() {
      const api = new ApiClient(
        'esi-ts-bench',
        BASE_URL,
        'eyJhbGciOiJSUzI1NiJ9.bench-access-token.signature',
      );
      const url = `${BASE_URL}/characters/2114794365/assets/?page=2`;
      return { fn: () => buildCacheKey(url, api, true) };
    },
  },
  {
    name: 'cache-policy/spec TTL lookup',
    setup() {
      return {
        fn: () => lookupSpecTtl('GET', 'characters/{characterId}/orders/'),
      };
    },
  },

  // ── Response headers ──────────────────────────────────────────────────
  {
    name: 'headers/parse ESI response headers',
    setup() {
      const headers = new Headers(ESI_RESPONSE_HEADERS);
      return { fn: () => parseHeaders(headers) };
    },
  },
  {
    name: 'headers/cache-control max-age',
    setup() {
      return { fn: () => parseCacheControlTtl(ESI_RESPONSE_HEADERS) };
    },
  },
  {
    name: 'headers/rate-limit update from response',
    setup() {
      const limiter = new RateLimiter({ minDelayMs: 0 });
      return {
        fn: () =>
          limiter.updateFromResponse(
            ESI_RESPONSE_HEADERS,
            200,
            ORDERS_TEMPLATE,
            'GET',
          ),
      };
    },
  },

  // ── Rate limiter and circuit breaker ──────────────────────────────────
  {
    name: 'rate-limiter/acquire, spacing off',
    setup() {
      const limiter = new RateLimiter({ minDelayMs: 0 });
      limiter.updateFromResponse(
        ESI_RESPONSE_HEADERS,
        200,
        ORDERS_TEMPLATE,
        'GET',
      );
      return { fn: () => limiter.checkRateLimit(ORDERS_TEMPLATE, 'GET') };
    },
  },
  {
    name: 'circuit-breaker/check, closed',
    setup() {
      const breaker = new CircuitBreaker();
      return {
        fn: () => breaker.checkCircuit('markets/10000002/orders/'),
        teardown: () => breaker.shutdown(),
      };
    },
  },
  {
    name: 'circuit-breaker/check + record success, 1000 endpoints',
    setup() {
      const breaker = new CircuitBreaker();
      const next = cycle(
        Array.from({ length: 1000 }, (_, i) => `characters/${90_000_000 + i}/`),
      );
      return {
        fn: () => {
          const endpoint = next();
          breaker.checkCircuit(endpoint);
          breaker.recordSuccess(endpoint);
        },
        teardown: () => breaker.shutdown(),
      };
    },
  },

  // ── Whole request pipeline, instant transport ─────────────────────────
  {
    name: 'pipeline/GET character public info',
    setup() {
      const api = pipelineClient(
        instantFetch(
          JSON.stringify(characterInfo(2114794365)),
          PIPELINE_HEADERS,
        ),
      );
      const characters = new CharacterClient(api);
      return {
        fn: () => characters.getCharacterPublicInfo(2114794365),
        teardown: () => shutdownPipeline(api),
      };
    },
  },
  {
    name: 'pipeline/GET 1000 region market orders',
    setup() {
      const api = pipelineClient(
        instantFetch(JSON.stringify(marketOrders(1000)), PIPELINE_HEADERS),
      );
      const market = new MarketClient(api);
      return {
        fn: () => market.getMarketOrders(10000002),
        teardown: () => shutdownPipeline(api),
      };
    },
  },
  {
    name: 'batch/batchFetch 100 keys, concurrency 10',
    setup() {
      const keys = Array.from({ length: 100 }, (_, i) => i);
      const fetcher = (key: number) => Promise.resolve(key);
      return { fn: () => batchFetch(keys, fetcher, { concurrency: 10 }) };
    },
  },
];
