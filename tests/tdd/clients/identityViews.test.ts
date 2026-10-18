/**
 * EsiClient.as(identity) and CustomEsiClient.as(identity): identity views of
 * the custom clients (option D step 4, #674). The wire behaviour is specified
 * in tests/bdd/features/core/0063-custom-client-identity-views.feature; these
 * pin the object model: one view per identity, shared middleware, a fixed
 * identity.
 */
import { EsiClient } from '../../../src/EsiClient';
import { EsiClientBuilder } from '../../../src/EsiClientBuilder';
import { ApiClient } from '../../../src/core/ApiClient';
import { identityFromProvider, identityFromToken } from '../../../src';
import { EsiConfigurationError } from '../../../src/core/util/error';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const apiClientOf = (client: unknown): ApiClient =>
  (client as { apiClient: ApiClient }).apiClient;

describe('EsiClient.as', () => {
  let client: EsiClient;
  beforeEach(() => {
    client = new EsiClient({ clientId: 'views-test', logLevel: 'error' });
  });
  afterEach(() => client.shutdown());

  it('returns the same view for the same identity, and another for another', () => {
    const alice = identityFromToken('alice-token');
    const view = client.as(alice);
    expect(client.as(alice)).toBe(view);
    expect(client.as(identityFromToken('bob-token'))).not.toBe(view);
  });

  it('answers as() on a view from the client it came from', () => {
    const alice = identityFromToken('alice-token');
    const bob = identityFromToken('bob-token');
    expect(client.as(alice).as(bob)).toBe(client.as(bob));
  });

  it('shares the cache, rate limiter, circuit breaker, deduplicator and middleware', () => {
    const root = apiClientOf(client);
    const view = apiClientOf(client.as(identityFromToken('alice-token')));
    expect(view).not.toBe(root);
    expect(view.getCache()).toBe(root.getCache());
    expect(view.getRateLimiter()).toBe(root.getRateLimiter());
    expect(view.getCircuitBreaker()).toBe(root.getCircuitBreaker());
    expect(view.getDeduplicator()).toBe(root.getDeduplicator());
    expect(view.getMiddleware()).toBe(root.getMiddleware());
  });

  it('builds its own domain clients over the view', () => {
    const view = client.as(identityFromToken('alice-token'));
    expect(view.market).not.toBe(client.market);
    expect(view.market).toBe(view.market);
  });

  it('reports through the diagnostics of the client it came from', () => {
    const view = client.as(identityFromToken('alice-token'));
    expect(view.diagnostics).toBe(client.diagnostics);
  });

  it('refuses to change its identity', () => {
    const view = client.as(identityFromToken('alice-token'));
    expect(() => view.setAccessToken('other')).toThrow(EsiConfigurationError);
    expect(() => view.setTokenProvider(() => Promise.resolve('x'))).toThrow(
      /setTokenProvider cannot change the identity of a view/,
    );
  });

  it('refuses to add an interceptor, which would run for every identity', () => {
    const view = client.as(identityFromToken('alice-token'));
    expect(() => view.addRequestInterceptor((ctx) => ctx)).toThrow(
      /addRequestInterceptor on a view made by as\(identity\)/,
    );
    expect(() => view.addResponseInterceptor((ctx) => ctx)).toThrow(
      EsiConfigurationError,
    );
  });

  it('asks the identity again for each later page of an offset walk', async () => {
    fetchMock.resetMocks();
    fetchMock.mockResponse(() =>
      Promise.resolve({
        body: '[]',
        headers: { 'content-type': 'application/json', 'x-pages': '2' },
      }),
    );
    let calls = 0;
    const view = client.as({
      accessToken: () => Promise.resolve(`rotated-${++calls}`),
    });
    await view.assets.getCharacterAssets(123);
    const sent = fetchMock.mock.calls.map((call) =>
      new Headers(call[1]?.headers).get('Authorization'),
    );
    expect(sent).toEqual(['Bearer rotated-1', 'Bearer rotated-2']);
    fetchMock.resetMocks();
  });

  it('leaves the shared cache running when the view is shut down', () => {
    const view = client.as(identityFromToken('alice-token'));
    const cache = apiClientOf(client).getCache() as unknown as {
      shutdown: () => void;
    };
    const shutdown = jest.spyOn(cache, 'shutdown');
    view.shutdown();
    expect(shutdown).not.toHaveBeenCalled();
    client.shutdown();
    expect(shutdown).toHaveBeenCalledTimes(1);
  });

  it('installs a refreshing identity as the token provider', () => {
    const refreshing = client.as(
      identityFromProvider(() => Promise.resolve('fresh')),
    );
    const raw = client.as(identityFromToken('raw'));
    expect(apiClientOf(refreshing).hasTokenProvider()).toBe(true);
    expect(apiClientOf(raw).hasTokenProvider()).toBe(false);
  });
});

describe('CustomEsiClient.as', () => {
  it('opens a view over the same enabled domains, one per identity', () => {
    const custom = new EsiClientBuilder()
      .addClients(['market', 'status'])
      .withClientId('views-test')
      .withConfig({ logLevel: 'error' })
      .build();
    const alice = identityFromToken('alice-token');
    const view = custom.as(alice);
    expect(custom.as(alice)).toBe(view);
    expect(view.getEnabledClients()).toEqual(custom.getEnabledClients());
    expect(view.market).toBeDefined();
    expect(view.market).not.toBe(custom.market);
    expect(view.wallet).toBeUndefined();
    expect(view.diagnostics).toBe(custom.diagnostics);
    expect(apiClientOf(view).getCache()).toBe(apiClientOf(custom).getCache());
    custom.shutdown();
  });
});

describe('ApiClient.forIdentity', () => {
  it('copies the settings and asks the identity for the token before an authenticated request', async () => {
    const root = new ApiClient('id', 'https://esi.evetech.net/');
    root.setLanguage('de');
    root.setCompatibilityDate('2026-08-18');
    root.setTimeout(1234);
    let calls = 0;
    const view = root.forIdentity({
      accessToken: () => Promise.resolve(`t${++calls}`),
    });
    expect(view.getLanguage()).toBe('de');
    expect(view.getCompatibilityDate()).toBe('2026-08-18');
    expect(view.getTimeout()).toBe(1234);
    expect(view.getLink()).toBe('https://esi.evetech.net');
    expect(view.getAuthorizationHeader()).toBeUndefined();
    await view.prepareToken(false);
    expect(calls).toBe(0);
    await view.prepareToken(true);
    expect(view.getAuthorizationHeader()).toBe('Bearer t1');
    await root.prepareToken(true);
    expect(root.getAuthorizationHeader()).toBeUndefined();
  });

  it('keeps a refreshed token when a lookup started before the refresh returns late', async () => {
    const root = new ApiClient('id', 'https://esi.evetech.net/');
    const lookups: ((token: string) => void)[] = [];
    const view = root.forIdentity({
      accessToken: () =>
        new Promise<string>((resolve) => {
          lookups.push(resolve);
        }),
      refreshAccessToken: () => Promise.resolve('refreshed'),
    });
    const lookup = view.prepareToken(true);
    await view.refreshToken();
    lookups[0]!('stale');
    await lookup;
    expect(view.getAuthorizationHeader()).toBe('Bearer refreshed');
  });
});
