/**
 * Every log call site reaches the per-client logger (#296): the rate limiter,
 * the ETag cache's startup line and the batch helpers behind `EsiClient.batch`.
 */
import { ApiClient } from '../../../src/core/ApiClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import {
  batchFetch,
  batchFetchFor,
  batchPost,
  batchPostFor,
} from '../../../src/core/BatchRequestHandler';
import { ETagCacheManager } from '../../../src/core/cache/ETagCacheManager';
import { configureApiClient } from '../../../src/core/configureApiClient';
import * as DefaultLogger from '../../../src/core/logger/DefaultLogger';
import { getLogger, setLogger } from '../../../src/core/logger/loggerUtil';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import * as sleepModule from '../../../src/core/util/sleep';
import { spyLogger } from '../helpers/spyLogger';

const clientLoggingTo = (logger: ReturnType<typeof spyLogger>): ApiClient => {
  const client = new ApiClient('test', 'https://esi.evetech.net/latest');
  client.setLogger(logger);
  return client;
};

describe('log call sites use the per-client logger', () => {
  const original = getLogger();
  let global: ReturnType<typeof spyLogger>;

  beforeEach(() => {
    global = spyLogger();
    setLogger(global);
  });

  afterEach(() => setLogger(original));

  describe('RateLimiter', () => {
    let sleepSpy: jest.SpyInstance;
    beforeEach(() => {
      sleepSpy = jest.spyOn(sleepModule, 'sleep').mockResolvedValue(undefined);
    });
    afterEach(() => sleepSpy.mockRestore());

    const lowErrorBudget = (limiter: RateLimiter): Promise<void> => {
      limiter.setTestMode(false);
      limiter.updateFromResponse(
        { 'x-esi-error-limit-remain': '5', 'x-esi-error-limit-reset': '1' },
        404,
      );
      return limiter.checkRateLimit();
    };

    it('warns to the attached client logger, not the global one', async () => {
      const own = spyLogger();
      const limiter = new RateLimiter();
      limiter.setClient(clientLoggingTo(own));

      await lowErrorBudget(limiter);

      expect(own.warn).toHaveBeenCalledWith(
        '[ESI Rate Limit] Legacy error limit low (5), waiting 1000ms',
        { errorLimitRemain: 5 },
      );
      expect(global.warn).not.toHaveBeenCalled();
    });

    it('falls back to the global logger with no client attached', async () => {
      await lowErrorBudget(new RateLimiter());

      expect(global.warn).toHaveBeenCalledTimes(1);
    });

    it('is attached to its client by configureApiClient and ApiClientBuilder', async () => {
      const own = spyLogger();
      const configured = new ApiClient('t', 'https://esi.evetech.net/latest');
      configureApiClient(configured, { logger: own, enableETagCache: false });
      const built = new ApiClientBuilder()
        .setClientId('t')
        .setLink('https://esi.evetech.net/latest')
        .build();
      built.setLogger(own);

      await lowErrorBudget(configured.getRateLimiter() as RateLimiter);
      await lowErrorBudget(built.getRateLimiter() as RateLimiter);

      expect(own.warn).toHaveBeenCalledTimes(2);
      expect(global.warn).not.toHaveBeenCalled();
    });
  });

  describe('ETagCacheManager', () => {
    it('sends its startup line to the client passed to the constructor', () => {
      const own = spyLogger();
      const cache = new ETagCacheManager(
        { maxEntries: 7 },
        clientLoggingTo(own),
      );
      cache.shutdown();

      expect(own.info).toHaveBeenCalledWith(
        'ETag cache manager initialized with 7 max entries',
        { maxEntries: 7 },
      );
      expect(global.info).not.toHaveBeenCalled();
    });

    it('logs its startup line to the client logger under configureApiClient', () => {
      const own = spyLogger();
      const client = new ApiClient('t', 'https://esi.evetech.net/latest');
      configureApiClient(client, { logger: own });
      (client.getCache() as ETagCacheManager).shutdown();

      expect(own.info).toHaveBeenCalledWith(
        'ETag cache manager initialized with 1000 max entries',
        { maxEntries: 1000 },
      );
      expect(global.info).not.toHaveBeenCalled();
    });
  });

  describe('batch helpers', () => {
    it('log to the client logger when given a client', async () => {
      const own = spyLogger();
      const client = clientLoggingTo(own);

      await batchFetchFor(client, [1, 2], async (k) => k, { concurrency: 2 });
      await batchPostFor(client, [1, 2, 3], async (ids) => ids, 2);

      expect(own.info.mock.calls.map((c) => c[0])).toEqual([
        'Batch fetch: 2 items, concurrency=2',
        'Batch POST: 3 IDs in 2 chunks of 2',
      ]);
      expect(own.debug).toHaveBeenCalledWith(
        'Batch complete: 2 succeeded, 0 failed',
        { succeeded: 2, failed: 0 },
      );
      expect(global.info).not.toHaveBeenCalled();
    });

    it('log to the global logger when called standalone', async () => {
      await batchFetch([1], async (k) => k);
      await batchPost([1], async (ids) => ids);

      expect(global.info).toHaveBeenCalledTimes(2);
    });
  });

  describe("logLevel: 'silent'", () => {
    it('is accepted and builds the per-client pino logger at that level', () => {
      const build = jest.spyOn(DefaultLogger, 'createDefaultLogger');
      try {
        const client = new ApiClient('t', 'https://esi.evetech.net/latest');
        configureApiClient(client, {
          logLevel: 'silent',
          enableETagCache: false,
        });

        expect(build).toHaveBeenCalledWith('silent');
        expect(client.getLogger()).toBe(build.mock.results[0]?.value);
      } finally {
        build.mockRestore();
      }
    });
  });
});
