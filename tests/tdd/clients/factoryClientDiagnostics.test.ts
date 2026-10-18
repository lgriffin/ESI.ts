/**
 * Diagnostics and shutdown on the domain clients (#677): a client from
 * EsiApiFactory.createClient owns its pipeline and can read and stop it; a
 * client reached through EsiClient or CustomEsiClient reports through its
 * parent's diagnostics and leaves the shared pipeline alone.
 */
import { EsiClient } from '../../../src/EsiClient';
import { EsiApiFactory, EsiClientBuilder } from '../../../src/EsiClientBuilder';
import type { StatusClient } from '../../../src/clients/StatusClient';
import type { ApiClient } from '../../../src/core/ApiClient';
import type { CacheStore } from '../../../src/core/ports/CacheStore';

const pipelineOf = (client: unknown): ApiClient =>
  (client as { _client: ApiClient })._client;

describe('a domain client from EsiApiFactory.createClient', () => {
  it('reads its own cache and breaker through one diagnostics object', () => {
    const status = EsiApiFactory.createClient('status', {
      logLevel: 'error',
      enableCircuitBreaker: true,
    }) as StatusClient;
    expect(status.diagnostics).toBe(status.diagnostics);
    expect(status.diagnostics.getCacheStats()).toMatchObject({
      totalEntries: 0,
    });
    expect(status.diagnostics.getCircuitBreakerStats()).toMatchObject({
      totalCircuits: 0,
    });
    status.shutdown();
  });

  it('stops the cache and circuit breaker it built when shut down', () => {
    const status = EsiApiFactory.createClient('status', {
      logLevel: 'error',
      enableCircuitBreaker: true,
    });
    const pipeline = pipelineOf(status);
    const cache = jest.spyOn(
      pipeline.getCache() as unknown as { shutdown: () => void },
      'shutdown',
    );
    const breaker = jest.spyOn(pipeline.getCircuitBreaker()!, 'shutdown');
    status.shutdown();
    expect(cache).toHaveBeenCalledTimes(1);
    expect(breaker).toHaveBeenCalledTimes(1);
  });

  it('leaves a supplied cache store to its owner', () => {
    const store: CacheStore = {
      get: () => null,
      set: () => undefined,
      delete: () => false,
      clear: () => undefined,
      shutdown: jest.fn(),
    } as unknown as CacheStore;
    const status = EsiApiFactory.createClient('status', {
      logLevel: 'error',
      cache: store,
    });
    status.shutdown();
    expect(
      (store as unknown as { shutdown: jest.Mock }).shutdown,
    ).not.toHaveBeenCalled();
  });

  it('is what the deprecated named factories build too', () => {
    // eslint-disable-next-line sonarjs/deprecation -- the named factories route through the same pipeline
    const market = EsiApiFactory.createMarketClient({ logLevel: 'error' });
    const cache = jest.spyOn(
      pipelineOf(market).getCache() as unknown as { shutdown: () => void },
      'shutdown',
    );
    market.shutdown();
    expect(cache).toHaveBeenCalledTimes(1);
  });
});

describe('a domain client reached through EsiClient or CustomEsiClient', () => {
  it("returns its parent's diagnostics object", () => {
    const client = new EsiClient({ logLevel: 'error' });
    expect(client.status.diagnostics).toBe(client.diagnostics);
    const custom = new EsiClientBuilder()
      .addClients(['status'])
      .withConfig({ logLevel: 'error' })
      .build();
    expect(custom.status!.diagnostics).toBe(custom.diagnostics);
    client.shutdown();
    custom.shutdown();
  });

  it('leaves the shared pipeline running when shut down', () => {
    const client = new EsiClient({ logLevel: 'error' });
    const cache = jest.spyOn(
      pipelineOf(client.status).getCache() as unknown as {
        shutdown: () => void;
      },
      'shutdown',
    );
    client.status.shutdown();
    expect(cache).not.toHaveBeenCalled();
    client.shutdown();
    expect(cache).toHaveBeenCalledTimes(1);
  });
});
