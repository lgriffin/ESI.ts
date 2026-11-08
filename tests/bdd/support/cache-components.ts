/**
 * The caches on their own, for 0079-cache-components.feature: a real
 * ETagCacheManager or CacheStoreCache reading a clock the scenario moves and
 * logging to a recording logger, the write log both share, and the keys the
 * pipeline files entries under.
 */
import { ApiClient } from '../../../src/core/ApiClient';
import { CacheStoreCache } from '../../../src/core/cache/CacheStoreCache';
import { ETagCacheManager } from '../../../src/core/cache/ETagCacheManager';
import type { ICache } from '../../../src/core/cache/ICache';
import type {
  CacheInvalidation,
  CacheStore,
} from '../../../src/core/ports/CacheStore';
import type { Clock } from '../../../src/core/ports/Clock';
import { makeJwt } from '../step-definitions/shared/sso-helpers';
import { type RecordingLogger, recordingLogger } from './logging';
import { MapCacheStore } from './shared-runtime';
import type { World } from './world';

/** Where the cache clock starts: any fixed time far from 0. */
export const CACHE_CLOCK_START = 10_000_000;

export interface CacheClock extends Clock {
  advance(ms: number): void;
}

export function cacheClock(): CacheClock {
  let now = CACHE_CLOCK_START;
  return {
    now: () => now,
    sleep: () => Promise.resolve(),
    advance(ms: number) {
      now += ms;
    },
  };
}

/** A real ApiClient whose logger records every line. */
export function loggingClient(world: World): ApiClient {
  const logger = recordingLogger();
  const client = new ApiClient('bdd-cache', 'https://esi.evetech.net');
  client.setLogger(logger);
  world.values.cacheLogger = logger;
  return client;
}

export function cacheLoggerOf(world: World): RecordingLogger {
  const logger = world.values.cacheLogger as RecordingLogger | undefined;
  if (!logger) throw new Error('No cache logger in this scenario');
  return logger;
}

export interface EtagCacheSetup {
  maxEntries?: number;
  defaultTtl?: number;
  /** 'default' leaves the interval to the cache. */
  cleanupInterval?: number | 'default';
  /** Attach the logging client after construction instead of at it. */
  attachLater?: boolean;
}

/** An ETagCacheManager on the scenario clock, shut down after the scenario. */
export function useEtagCache(world: World, setup: EtagCacheSetup = {}): void {
  const clock = cacheClock();
  const client = loggingClient(world);
  const cache = new ETagCacheManager(
    {
      maxEntries: setup.maxEntries,
      defaultTtl: setup.defaultTtl,
      // An hour unless the scenario is about the timer: it must not run.
      cleanupInterval:
        setup.cleanupInterval === 'default'
          ? undefined
          : (setup.cleanupInterval ?? 3_600_000),
    },
    setup.attachLater ? null : client,
    clock,
  );
  world.cleanups.push(() => cache.shutdown());
  world.values.cache = cache;
  world.values.cacheClock = clock;
  world.values.cacheClient = client;
}

/** A store that carries invalidations, as a shared Redis store would. */
export class BroadcastStore extends MapCacheStore {
  private readonly listeners = new Set<(event: CacheInvalidation) => void>();
  readonly published: CacheInvalidation[] = [];

  publishInvalidation(event: CacheInvalidation): void {
    this.published.push(event);
  }

  onInvalidate(listener: (event: CacheInvalidation) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** An invalidation another process published. */
  receive(event: CacheInvalidation): void {
    for (const listener of this.listeners) listener(event);
  }
}

/** A CacheStoreCache over a BroadcastStore, on the scenario clock. */
export function useStoreCache(world: World): void {
  const clock = cacheClock();
  const store = new BroadcastStore();
  const cache = new CacheStoreCache(store, clock);
  world.values.cache = cache;
  world.values.cacheClock = clock;
  world.values.store = store;
}

export function cacheOf(world: World): ICache {
  const cache = world.values.cache as ICache | undefined;
  if (!cache) throw new Error('No cache in this scenario');
  return cache;
}

export function etagCacheOf(world: World): ETagCacheManager {
  const cache = cacheOf(world);
  if (!(cache instanceof ETagCacheManager))
    throw new Error('This scenario does not use an ETag cache');
  return cache;
}

export function storeCacheOf(world: World): CacheStoreCache {
  const cache = cacheOf(world);
  if (!(cache instanceof CacheStoreCache))
    throw new Error('This scenario does not use a cache store adapter');
  return cache;
}

export function storeOf(world: World): BroadcastStore {
  const store = world.values.store as BroadcastStore | undefined;
  if (!store) throw new Error('No cache store in this scenario');
  return store;
}

export function cacheClockOf(world: World): CacheClock {
  const clock = world.values.cacheClock as CacheClock | undefined;
  if (!clock) throw new Error('No cache clock in this scenario');
  return clock;
}

/** What a scenario stores under `url`: the URL itself, and one header. */
export function storeEntry(
  world: World,
  url: string,
  etag: string,
  ttl?: number,
): void {
  cacheOf(world).set(url, etag, { url }, { 'x-esi-request-id': url }, ttl);
}

/** The statistics the scenario reads, as a Then step compares them. */
export function statsOf(world: World): ReturnType<ICache['getStats']> {
  return cacheOf(world).getStats();
}

/** The lines the cache logged, as `level message`. */
export function loggedLines(world: World): string[] {
  return cacheLoggerOf(world).lines.map((l) => `${l.level} ${l.message}`);
}

/** The context of the line logged with `message`. */
export function contextOfLine(world: World, message: string): unknown {
  const line = cacheLoggerOf(world).lines.find((l) => l.message === message);
  if (!line)
    throw new Error(
      `No line "${message}" in ${loggedLines(world).join(' | ')}`,
    );
  return line.context;
}

/**
 * A store that also implements the pipeline's wider cache calls, less the
 * one named, for the check `cacheFromStore` makes before using a store as
 * itself.
 */
export function widerStore(missing: string): CacheStore {
  const store = new MapCacheStore() as MapCacheStore & Record<string, unknown>;
  const calls: Record<string, unknown> = {
    getETag: (url: string) => store.get(url)?.etag ?? null,
    has: (url: string) => store.get(url) !== null,
    deleteByPath: () => 0,
    getStats: () => ({}),
  };
  for (const [name, call] of Object.entries(calls)) {
    if (name !== missing) store[name] = call;
  }
  return store;
}

/** A client for cache keys; the token, when given, names `characterId`. */
export function keyClient(link = 'https://esi.evetech.net'): ApiClient {
  return new ApiClient('bdd-cache-key', link);
}

/** An SSO access token naming the character. */
export function tokenFor(characterId: number): string {
  return makeJwt({ characterId });
}
