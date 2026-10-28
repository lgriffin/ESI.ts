/**
 * The config fields every construction surface maps onto its ApiClient
 * (ARCH-08), their environment fallbacks, and what an identity view's
 * shutdown leaves running. Written to kill the survivors the `surfaces`
 * unit mutation shard found in EsiClient.ts and EsiClientBuilder.ts.
 */
import { EsiClient } from '../../../src/EsiClient';
import { EsiApiFactory, EsiClientBuilder } from '../../../src/EsiClientBuilder';
import type { ApiClient } from '../../../src/core/ApiClient';
import type { EsiClientConfig } from '../../../src/core/EsiClientConfig';
import { identityFromToken } from '../../../src/core/identity';

type Surface = 'EsiClient' | 'EsiClientBuilder' | 'EsiApiFactory';

const SURFACES: Surface[] = ['EsiClient', 'EsiClientBuilder', 'EsiApiFactory'];

const DEFAULT_CLIENT_ID: Record<Surface, string> = {
  EsiClient: 'esi-client',
  EsiClientBuilder: 'esi-custom-client',
  EsiApiFactory: 'esi-standalone-client',
};

const opened: Array<{ shutdown(): void }> = [];

/** The ApiClient a surface built from `config`. */
function apiClientOf(surface: Surface, config?: EsiClientConfig): ApiClient {
  switch (surface) {
    case 'EsiClient': {
      const client = new EsiClient(config);
      opened.push(client);
      return (client as unknown as { apiClient: ApiClient }).apiClient;
    }
    case 'EsiClientBuilder': {
      const client = new EsiClientBuilder()
        .withConfig(config ?? {})
        .addClient('status')
        .build();
      opened.push(client);
      return (client as unknown as { apiClient: ApiClient }).apiClient;
    }
    case 'EsiApiFactory': {
      const client = EsiApiFactory.createClient('status', config);
      opened.push(client);
      return (client as unknown as { _client: ApiClient })._client;
    }
  }
}

const ENV = [
  'ESI_BASE_URL',
  'ESI_CLIENT_ID',
  'ESI_ACCESS_TOKEN',
  'ESI_DATASOURCE',
] as const;
const savedEnv: Partial<Record<(typeof ENV)[number], string>> = {};

beforeEach(() => {
  for (const key of ENV) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  for (const client of opened.splice(0)) client.shutdown();
});

describe.each(SURFACES)('%s maps its config onto the pipeline', (surface) => {
  it('uses the defaults when given nothing', () => {
    const api = apiClientOf(surface);
    expect(api.getLink()).toBe('https://esi.evetech.net');
    expect(api.getClientId()).toBe(DEFAULT_CLIENT_ID[surface]);
    expect(api.getAuthorizationHeader()).toBeUndefined();
    expect(api.getLanguage()).toBeUndefined();
    expect(api.getDatasource()).toBeUndefined();
    expect(api.hasTokenProvider()).toBe(false);
  });

  it('carries every identity and locale field it is given', () => {
    const api = apiClientOf(surface, {
      baseUrl: 'https://esi.example.test',
      unsafeAllowCustomHost: true,
      clientId: 'my-app',
      accessToken: 'config-token',
      language: 'de',
      compatibilityDate: '2025-08-26',
      datasource: 'tranquility',
      onTokenRefresh: () => Promise.resolve('fresh'),
    });
    expect(api.getLink()).toBe('https://esi.example.test');
    expect(api.getClientId()).toBe('my-app');
    expect(api.getAuthorizationHeader()).toBe('Bearer config-token');
    expect(api.getLanguage()).toBe('de');
    expect(api.getCompatibilityDate()).toBe('2025-08-26');
    expect(api.getDatasource()).toBe('tranquility');
    expect(api.hasTokenProvider()).toBe(true);
  });

  it('falls back to the environment for the base URL, client id and token', () => {
    process.env.ESI_BASE_URL = 'https://esi.evetech.net/env';
    process.env.ESI_CLIENT_ID = 'env-client';
    process.env.ESI_ACCESS_TOKEN = 'env-token';
    const api = apiClientOf(surface);
    expect(api.getLink()).toBe('https://esi.evetech.net/env');
    expect(api.getClientId()).toBe('env-client');
    expect(api.getAuthorizationHeader()).toBe('Bearer env-token');
  });

  it('prefers the config to the environment', () => {
    process.env.ESI_BASE_URL = 'https://esi.evetech.net/env';
    process.env.ESI_CLIENT_ID = 'env-client';
    process.env.ESI_ACCESS_TOKEN = 'env-token';
    const api = apiClientOf(surface, {
      baseUrl: 'https://esi.evetech.net/config',
      clientId: 'config-client',
      accessToken: 'config-token',
    });
    expect(api.getLink()).toBe('https://esi.evetech.net/config');
    expect(api.getClientId()).toBe('config-client');
    expect(api.getAuthorizationHeader()).toBe('Bearer config-token');
  });

  it('validates a base URL from the environment like one from the config', () => {
    process.env.ESI_BASE_URL = 'https://evil.example';
    expect(() => apiClientOf(surface)).toThrow(/allowlist/);
  });
});

describe('EsiClient', () => {
  it('reads the datasource from ESI_DATASOURCE when the config names none', () => {
    process.env.ESI_DATASOURCE = 'tranquility';
    expect(apiClientOf('EsiClient').getDatasource()).toBe('tranquility');
  });

  it('applies a token and a token provider set after construction', () => {
    const client = new EsiClient();
    opened.push(client);
    const api = (client as unknown as { apiClient: ApiClient }).apiClient;
    client.setAccessToken('later-token');
    expect(api.getAuthorizationHeader()).toBe('Bearer later-token');
    client.setTokenProvider(() => Promise.resolve('fresh'));
    expect(api.hasTokenProvider()).toBe(true);
    client.setTokenProvider(undefined);
    expect(api.hasTokenProvider()).toBe(false);
  });
});

describe.each([
  ['EsiClient', () => new EsiClient({ enableCircuitBreaker: true })],
  [
    'EsiClientBuilder',
    () =>
      new EsiClientBuilder()
        .withConfig({ enableCircuitBreaker: true })
        .addClient('status')
        .build(),
  ],
] as const)('an identity view of %s', (_surface, build) => {
  it('leaves the shared cache and circuit breaker running when it shuts down', () => {
    const root = build();
    opened.push(root);
    const api = (root as unknown as { apiClient: ApiClient }).apiClient;
    const cache = api.getCache() as unknown as { shutdown(): void };
    const breaker = api.getCircuitBreaker()!;
    const cacheShutdown = jest.spyOn(cache, 'shutdown');
    const breakerShutdown = jest.spyOn(breaker, 'shutdown');

    root.as(identityFromToken('view-token')).shutdown();

    expect(cacheShutdown).not.toHaveBeenCalled();
    expect(breakerShutdown).not.toHaveBeenCalled();
    root.shutdown();
    expect(cacheShutdown).toHaveBeenCalled();
    expect(breakerShutdown).toHaveBeenCalled();
    opened.pop();
  });
});
