/**
 * The ports in src/core/ports are the seams later Phase 2 PRs build on. These
 * cases pin that the existing implementations already satisfy them, so an
 * adapter can be swapped in without changing the classes. The assignments are
 * checked by the compiler (ts-jest type-checks this file); the runtime cases
 * confirm the behaviour each port documents.
 */
import type {
  FetchLike,
  TokenProvider as ApiTokenProvider,
} from '../../../src/core/ApiClient';
import type { ICache } from '../../../src/core/cache/ICache';
import { ETagCacheManager } from '../../../src/core/cache/ETagCacheManager';
import { systemClock } from '../../../src/core/clock';
import { createDefaultLogger } from '../../../src/core/logger/DefaultLogger';
import type { ILogger } from '../../../src/core/logger/ILogger';
import { createNoopLogger } from '../../../src/core/logger/NoopLogger';
import type {
  CacheStore,
  Clock,
  HttpTransport,
  Logger,
  TokenProvider,
} from '../../../src/core/ports';

/** Compiles only when A and B are assignable both ways. */
function sameShape<A, B>(
  check: [A] extends [B] ? ([B] extends [A] ? true : false) : false,
) {
  return check;
}

describe('CacheStore', () => {
  it('is satisfied by ETagCacheManager and by any ICache', () => {
    const cache = new ETagCacheManager({ cleanupInterval: 0 });
    const store: CacheStore = cache;
    const fromInterface = (c: ICache): CacheStore => c;
    try {
      store.set('https://esi/x', '"v1"', { a: 1 }, { 'x-pages': '1' });
      expect(fromInterface(cache).get('https://esi/x')).toMatchObject({
        etag: '"v1"',
        data: { a: 1 },
      });
      expect(store.delete('https://esi/x')).toBe(true);
      expect(store.get('https://esi/x')).toBeNull();
    } finally {
      store.shutdown();
    }
  });
});

describe('Logger', () => {
  it('has the same shape as ILogger, and the package loggers satisfy it', () => {
    expect(sameShape<Logger, ILogger>(true)).toBe(true);
    const loggers: Logger[] = [
      createNoopLogger(),
      createDefaultLogger('silent'),
    ];
    for (const logger of loggers) {
      expect(() =>
        logger.debug('ports test', { endpoint: 'status' }),
      ).not.toThrow();
    }
  });
});

describe('TokenProvider and HttpTransport', () => {
  it('match the TokenProvider and FetchLike that ApiClient accepts', () => {
    expect(sameShape<TokenProvider, ApiTokenProvider>(true)).toBe(true);
    expect(sameShape<HttpTransport, FetchLike>(true)).toBe(true);
  });

  it('are satisfied by fetch and by a plain token function', async () => {
    const transport: HttpTransport = fetch;
    const tokens: TokenProvider = async () => 'token';
    expect(typeof transport).toBe('function');
    await expect(tokens()).resolves.toBe('token');
  });
});

describe('systemClock', () => {
  afterEach(() => jest.useRealTimers());

  it('reads the wall clock', () => {
    jest.useFakeTimers({ now: 1_790_000_000_000 });
    const clock: Clock = systemClock;
    expect(clock.now()).toBe(1_790_000_000_000);
  });

  it('sleeps for the given time and no less', async () => {
    jest.useFakeTimers();
    let done = false;
    const sleeping = systemClock.sleep(1000).then(() => (done = true));
    await jest.advanceTimersByTimeAsync(999);
    expect(done).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    await sleeping;
    expect(done).toBe(true);
  });
});
