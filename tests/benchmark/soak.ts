/**
 * The heap soak: drive a large number of requests through a real `EsiClient`
 * and record, at intervals, what a long-running process would leak.
 *
 * The transport is an in-process `fetch` stub installed on `globalThis` (the
 * client reads it per request), so throughput is the client's own. Every
 * layer between the domain client and `fetch` is the one consumers run: rate
 * limiter, deduplication, ETag cache, retry, middleware and Zod validation.
 *
 * By default every request uses a key no earlier request used, so any state
 * kept per key grows with the run unless something bounds it, and the cache
 * is full and evicting for almost the whole run. The mix:
 * - 8 in 10: a character lookup with an ETag (cached, then evicted);
 * - 1 in 10: market prices, one key (served from the spec-TTL cache);
 * - 1 in 10: an alliance lookup answered 404 (the error path).
 *
 * At each sample point every in-flight request has settled; the driver forces
 * two full collections and records `heapUsed`, the cache size and the active
 * timers. `scripts/soak-core.ts` decides whether the run leaked.
 */
import { EsiClient } from '../../src/EsiClient';
import { EsiError } from '../../src/core/util/error';
import { createNoopLogger } from '../../src/core/logger/NoopLogger';
import type {
  ResponseContext,
  ResponseInterceptor,
} from '../../src/core/middleware/Middleware';
import { characterInfo } from './fixtures';

export interface SoakOptions {
  requests: number;
  distinctKeys: number;
  cacheMaxEntries: number;
  /** Requests issued together per step. */
  concurrency: number;
  /** Sample points across the run. */
  samples: number;
  /** A full, synchronous garbage collection (`global.gc` under --expose-gc). */
  gc: () => void;
  /**
   * Extra response interceptors. The leak fixture injects one that retains
   * every response, which the analysis must flag.
   */
  responseInterceptors?: ResponseInterceptor[];
  /** Enable the opt-in circuit breaker (off in the default profile). */
  circuitBreaker?: boolean;
}

export interface SoakSample {
  requests: number;
  heapUsed: number;
  cacheEntries: number;
  timers: number;
}

export interface SoakRun {
  options: Omit<SoakOptions, 'gc' | 'responseInterceptors'>;
  samples: SoakSample[];
  timersBefore: number;
  timersAfterShutdown: number;
  listenersBefore: number;
  listenersAfterShutdown: number;
  /** Rejections other than the 404s the mix asks for. */
  unexpectedErrors: string[];
  durationMs: number;
}

export const SOAK_DEFAULTS: Omit<SoakOptions, 'gc'> = {
  requests: 100_000,
  distinctKeys: 100_000,
  cacheMaxEntries: 500,
  concurrency: 16,
  samples: 50,
};

function activeTimers(): number {
  return process
    .getActiveResourcesInfo()
    .filter((resource) => resource === 'Timeout').length;
}

function processListeners(): number {
  return process
    .eventNames()
    .reduce((sum, name) => sum + process.listenerCount(name), 0);
}

const JSON_HEADERS = { 'content-type': 'application/json; charset=UTF-8' };
const PRICES = JSON.stringify([
  { type_id: 34, average_price: 5.1, adjusted_price: 5.02 },
  { type_id: 35, average_price: 11.2, adjusted_price: 11.05 },
]);

/** Answers like ESI, from the path alone. */
function stubFetch(input: RequestInfo | URL): Promise<Response> {
  const url = String(input);
  const character = /\/characters\/(\d+)\//.exec(url);
  if (character) {
    const id = Number(character[1]);
    return Promise.resolve(
      new Response(JSON.stringify(characterInfo(id)), {
        status: 200,
        headers: { ...JSON_HEADERS, etag: `"c-${id}"` },
      }),
    );
  }
  if (url.includes('/markets/prices/')) {
    return Promise.resolve(
      new Response(PRICES, {
        status: 200,
        headers: { ...JSON_HEADERS, etag: '"prices"' },
      }),
    );
  }
  return Promise.resolve(
    new Response(JSON.stringify({ error: 'Alliance not found' }), {
      status: 404,
      headers: JSON_HEADERS,
    }),
  );
}

function request(client: EsiClient, index: number, keys: number) {
  const key = index % keys;
  switch (index % 10) {
    case 8:
      return client.market.getMarketPrices();
    case 9:
      return client.alliance.getAllianceById(99_000_000 + key);
    default:
      return client.characters.getCharacterPublicInfo(90_000_000 + key);
  }
}

export async function runSoak(options: SoakOptions): Promise<SoakRun> {
  const { gc, responseInterceptors, ...recorded } = options;
  const originalFetch = globalThis.fetch;
  const unexpectedErrors: string[] = [];

  gc();
  const timersBefore = activeTimers();
  const listenersBefore = processListeners();
  const started = performance.now();

  globalThis.fetch = stubFetch as typeof fetch;
  const client = new EsiClient({
    rateLimiterConfig: { minDelayMs: 0 },
    etagCacheConfig: { maxEntries: options.cacheMaxEntries },
    logger: createNoopLogger(),
    responseInterceptors,
    enableCircuitBreaker: options.circuitBreaker ?? false,
  });

  const samples: SoakSample[] = [];
  const every = Math.max(1, Math.floor(options.requests / options.samples));
  try {
    for (let sent = 0; sent < options.requests;) {
      const batch = Math.min(options.concurrency, options.requests - sent);
      const settled = await Promise.allSettled(
        Array.from({ length: batch }, (_, i) =>
          request(client, sent + i, options.distinctKeys),
        ),
      );
      for (const outcome of settled) {
        if (
          outcome.status === 'rejected' &&
          !(
            outcome.reason instanceof EsiError &&
            outcome.reason.statusCode === 404
          )
        ) {
          unexpectedErrors.push(String(outcome.reason));
        }
      }
      const before = Math.floor(sent / every);
      sent += batch;
      if (Math.floor(sent / every) > before || sent === options.requests) {
        gc();
        gc();
        samples.push({
          requests: sent,
          heapUsed: process.memoryUsage().heapUsed,
          cacheEntries: client.getCacheStats()?.totalEntries ?? 0,
          timers: activeTimers(),
        });
      }
    }
  } finally {
    client.shutdown();
    globalThis.fetch = originalFetch;
  }

  // Let anything scheduled by shutdown settle before counting what is left.
  await new Promise((resolve) => setImmediate(resolve));
  gc();

  return {
    options: recorded,
    samples,
    timersBefore,
    timersAfterShutdown: activeTimers(),
    listenersBefore,
    listenersAfterShutdown: processListeners(),
    unexpectedErrors: unexpectedErrors.slice(0, 20),
    durationMs: Math.round(performance.now() - started),
  };
}

/**
 * The negative fixture: a response interceptor that keeps every response it
 * sees in a map keyed by a running counter, so nothing it holds is ever
 * released. A soak that does not flag a client carrying this is broken.
 */
export function leakyInterceptor(): ResponseInterceptor {
  const retained = new Map<number, ResponseContext>();
  return (context) => {
    retained.set(retained.size, context);
    return context;
  };
}
