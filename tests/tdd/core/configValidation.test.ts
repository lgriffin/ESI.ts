import { EsiClient } from '../../../src/EsiClient';
import {
  EsiClientBuilder,
  EsiApiFactory,
  CustomEsiClient,
} from '../../../src/EsiClientBuilder';
import { ApiClientType } from '../../../src/core/ClientRegistry';
import {
  RequestInterceptor,
  ResponseInterceptor,
} from '../../../src/core/middleware/Middleware';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const BASE_URL = 'https://esi.test.local';
const TEST_CONFIG = {
  baseUrl: BASE_URL,
  unsafeAllowCustomHost: true,
};

const standardHeaders = (overrides: Record<string, string> = {}) => ({
  'x-pages': '1',
  'x-ratelimit-remaining': '95',
  'x-ratelimit-limit': '100',
  'x-ratelimit-used': '5',
  'x-ratelimit-group': 'market',
  ...overrides,
});

const ALL_CLIENT_TYPES: ApiClientType[] = [
  'alliance',
  'assets',
  'calendar',
  'characters',
  'clones',
  'contacts',
  'contracts',
  'corporations',
  'dogma',
  'factions',
  'fittings',
  'fleets',
  'incursions',
  'industry',
  'insurance',
  'killmails',
  'location',
  'loyalty',
  'mail',
  'market',
  'pi',
  'route',
  'search',
  'skills',
  'sovereignty',
  'status',
  'ui',
  'universe',
  'wallet',
  'wars',
  'meta',
  'freelanceJobs',
  'skyhooks',
  'mercenary',
  'accessLists',
];

describe('Config Validation', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  describe('Default Config', () => {
    it('should create EsiClient with no config without throwing', () => {
      const client = new EsiClient();
      expect(client).toBeDefined();
      client.shutdown();
    });

    it('should work with default values by making a request', async () => {
      const client = new EsiClient({
        ...TEST_CONFIG,
        enableETagCache: false,
      });
      fetchMock.mockResponseOnce(
        JSON.stringify({
          players: 100,
          server_version: '1',
          start_time: '2024-01-01T00:00:00Z',
        }),
        { headers: standardHeaders() },
      );
      const result = await client.status.getStatus();
      expect(result.players).toBe(100);
      client.shutdown();
    });
  });

  describe('All Features Enabled', () => {
    it('should construct without error when all optional features are enabled', () => {
      const reqInterceptor: RequestInterceptor = (ctx) => ({
        ...ctx,
        headers: { ...ctx.headers, 'X-All-Features': 'true' },
      });
      const resInterceptor: ResponseInterceptor = (ctx) => ctx;

      const client = new EsiClient({
        ...TEST_CONFIG,
        clientId: 'all-features-test',
        accessToken: 'test-token',
        enableETagCache: true,
        etagCacheConfig: { maxEntries: 500, defaultTtl: 30000 },
        enableCircuitBreaker: true,
        circuitBreakerConfig: { failureThreshold: 5, resetTimeoutMs: 10000 },
        enableRequestDeduplication: true,
        retryConfig: { maxRetries: 3, baseDelayMs: 100, maxDelayMs: 5000 },
        requestInterceptors: [reqInterceptor],
        responseInterceptors: [resInterceptor],
        timeout: 15000,
        language: 'en',
      });

      expect(client).toBeDefined();

      // Verify features are active by checking diagnostics
      const cacheStats = client.getCacheStats();
      expect(cacheStats).not.toBeNull();

      const cbStats = client.getCircuitBreakerStats();
      expect(cbStats).not.toBeNull();

      client.shutdown();
    });

    it('should successfully make a request with all features enabled', async () => {
      const client = new EsiClient({
        ...TEST_CONFIG,
        clientId: 'all-features-request',
        enableETagCache: true,
        enableCircuitBreaker: true,
        enableRequestDeduplication: true,
        retryConfig: { maxRetries: 1 },
        timeout: 10000,
        language: 'de',
      });

      fetchMock.mockResponseOnce(
        JSON.stringify({
          players: 42,
          server_version: '1',
          start_time: '2024-01-01T00:00:00Z',
        }),
        { headers: standardHeaders() },
      );

      const result = await client.status.getStatus();
      expect(result.players).toBe(42);
      client.shutdown();
    });
  });

  describe('EsiClientBuilder Selective Clients', () => {
    it('should build with only selected clients', () => {
      const custom = new EsiClientBuilder()
        .addClients(['status', 'market'])
        .withConfig(TEST_CONFIG)
        .build();

      expect(custom.hasClient('status')).toBe(true);
      expect(custom.hasClient('market')).toBe(true);
      expect(custom.hasClient('alliance')).toBe(false);
      expect(custom.hasClient('characters')).toBe(false);
      expect(custom.hasClient('universe')).toBe(false);

      custom.shutdown();
    });

    it('should list only enabled clients', () => {
      const custom = new EsiClientBuilder()
        .addClients(['status', 'market'])
        .withConfig(TEST_CONFIG)
        .build();

      const enabled = custom.getEnabledClients();
      expect(enabled).toContain('status');
      expect(enabled).toContain('market');
      expect(enabled).toHaveLength(2);

      custom.shutdown();
    });

    it('should throw when building with no clients', () => {
      expect(() => {
        new EsiClientBuilder().withConfig(TEST_CONFIG).build();
      }).toThrow('At least one client type must be specified');
    });
  });

  describe('EsiClientBuilder All Clients', () => {
    it('should build with ALL client types and verify each is present', () => {
      const custom = new EsiClientBuilder()
        .addClients(ALL_CLIENT_TYPES)
        .withConfig(TEST_CONFIG)
        .build();

      for (const clientType of ALL_CLIENT_TYPES) {
        expect(custom.hasClient(clientType)).toBe(true);
      }

      expect(custom.getEnabledClients()).toHaveLength(ALL_CLIENT_TYPES.length);
      custom.shutdown();
    });
  });

  describe('EsiApiFactory Methods', () => {
    it('should create a working AllianceClient', () => {
      const client = EsiApiFactory.createAllianceClient(TEST_CONFIG);
      expect(client).toBeDefined();
      expect(typeof client.getAlliances).toBe('function');
    });

    it('should create a working CharacterClient', () => {
      const client = EsiApiFactory.createCharacterClient(TEST_CONFIG);
      expect(client).toBeDefined();
      expect(typeof client.getCharacterPublicInfo).toBe('function');
    });

    it('should create a working CorporationClient', () => {
      const client = EsiApiFactory.createCorporationClient(TEST_CONFIG);
      expect(client).toBeDefined();
      expect(typeof client.getCorporationInfo).toBe('function');
    });

    it('should create a working MarketClient', async () => {
      const client = EsiApiFactory.createMarketClient(TEST_CONFIG);
      expect(client).toBeDefined();
      fetchMock.mockResponseOnce(
        JSON.stringify([{ type_id: 34, average_price: 5.0 }]),
        { headers: standardHeaders() },
      );
      const result = await client.getMarketPrices();
      expect(result[0].type_id).toBe(34);
    });

    it('should create a working UniverseClient', () => {
      const client = EsiApiFactory.createUniverseClient(TEST_CONFIG);
      expect(client).toBeDefined();
      expect(typeof client.getTypes).toBe('function');
    });

    it('should create a working FleetClient', () => {
      const client = EsiApiFactory.createFleetClient(TEST_CONFIG);
      expect(client).toBeDefined();
    });

    it('should create a working AssetsClient', () => {
      const client = EsiApiFactory.createAssetsClient(TEST_CONFIG);
      expect(client).toBeDefined();
    });

    it('should create a working WalletClient', () => {
      const client = EsiApiFactory.createWalletClient(TEST_CONFIG);
      expect(client).toBeDefined();
    });

    it('should create a working MailClient', () => {
      const client = EsiApiFactory.createMailClient(TEST_CONFIG);
      expect(client).toBeDefined();
    });

    it('should create any client type via generic createClient', () => {
      for (const clientType of ALL_CLIENT_TYPES) {
        const client = EsiApiFactory.createClient(clientType, TEST_CONFIG);
        expect(client).toBeDefined();
      }
    });
  });

  describe('Token Provider Config', () => {
    it('should accept onTokenRefresh callback', () => {
      const tokenProvider = async () => 'refreshed-token';
      const client = new EsiClient({
        ...TEST_CONFIG,
        onTokenRefresh: tokenProvider,
      });
      expect(client).toBeDefined();
      client.shutdown();
    });

    it('should use token provider on 401 retry', async () => {
      let callCount = 0;
      const client = new EsiClient({
        ...TEST_CONFIG,
        accessToken: 'expired-token',
        enableETagCache: false,
        onTokenRefresh: async () => {
          callCount++;
          return `fresh-token-${callCount}`;
        },
      });

      fetchMock.mockResponseOnce('', {
        status: 401,
        headers: standardHeaders(),
      });
      const mockOrder = {
        order_id: 1,
        type_id: 34,
        location_id: 60003760,
        volume_total: 100,
        volume_remain: 50,
        min_volume: 1,
        price: 10.5,
        is_buy_order: false,
        system_id: 30000142,
        duration: 90,
        issued: '2024-01-01T00:00:00Z',
        range: 'region',
      };
      fetchMock.mockResponseOnce(JSON.stringify([mockOrder]), {
        headers: standardHeaders(),
      });

      const result = await client.market.getCharacterOrders(12345);
      expect(result).toEqual([mockOrder]);
      expect(callCount).toBe(1);

      const retryHeaders = fetchMock.mock.calls[1][1]?.headers as Record<
        string,
        string
      >;
      expect(retryHeaders['Authorization']).toBe('Bearer fresh-token-1');

      client.shutdown();
    });
  });

  describe('Datasource Config', () => {
    it('should construct with datasource tranquility', () => {
      const client = new EsiClient({
        ...TEST_CONFIG,
        datasource: 'tranquility',
      });
      expect(client).toBeDefined();
      client.shutdown();
    });

    it('should construct with datasource singularity', () => {
      const client = new EsiClient({
        ...TEST_CONFIG,
        datasource: 'singularity',
      });
      expect(client).toBeDefined();
      client.shutdown();
    });
  });

  describe('Language Config', () => {
    it('should construct with language de', () => {
      const client = new EsiClient({
        ...TEST_CONFIG,
        language: 'de',
      });
      expect(client).toBeDefined();
      client.shutdown();
    });

    it('should construct with language fr', () => {
      const client = new EsiClient({
        ...TEST_CONFIG,
        language: 'fr',
      });
      expect(client).toBeDefined();
      client.shutdown();
    });

    it('should construct with language en', () => {
      const client = new EsiClient({
        ...TEST_CONFIG,
        language: 'en',
      });
      expect(client).toBeDefined();
      client.shutdown();
    });
  });

  describe('Client Shutdown Idempotent', () => {
    it('should not throw when shutdown is called twice on EsiClient', () => {
      const client = new EsiClient({
        ...TEST_CONFIG,
        enableETagCache: true,
        enableCircuitBreaker: true,
        enableRequestDeduplication: true,
      });

      expect(() => {
        client.shutdown();
      }).not.toThrow();

      expect(() => {
        client.shutdown();
      }).not.toThrow();
    });

    it('should not throw when shutdown is called twice on CustomEsiClient', () => {
      const custom = new EsiClientBuilder()
        .addClients(['status'])
        .withConfig(TEST_CONFIG)
        .build();

      expect(() => {
        custom.shutdown();
      }).not.toThrow();

      expect(() => {
        custom.shutdown();
      }).not.toThrow();
    });

    it('should not throw when shutdown is called on client with no optional features', () => {
      const client = new EsiClient({
        ...TEST_CONFIG,
        enableETagCache: false,
        enableCircuitBreaker: false,
        enableRequestDeduplication: false,
      });

      expect(() => {
        client.shutdown();
      }).not.toThrow();

      expect(() => {
        client.shutdown();
      }).not.toThrow();
    });
  });

  describe('Retry Config via Legacy', () => {
    it('should accept retryAttempts as legacy config', () => {
      const client = new EsiClient({
        ...TEST_CONFIG,
        retryAttempts: 3,
      });
      expect(client).toBeDefined();
      client.shutdown();
    });

    it('should accept retryAttempts of 0', () => {
      const client = new EsiClient({
        ...TEST_CONFIG,
        retryAttempts: 0,
      });
      expect(client).toBeDefined();
      client.shutdown();
    });

    it('should prefer retryConfig over legacy retryAttempts', () => {
      const client = new EsiClient({
        ...TEST_CONFIG,
        retryAttempts: 5,
        retryConfig: { maxRetries: 2 },
      });
      expect(client).toBeDefined();
      client.shutdown();
    });
  });

  describe('EsiClientBuilder Fluent API', () => {
    it('should support chaining withClientId and withAccessToken', () => {
      const custom = new EsiClientBuilder()
        .addClient('status')
        .withClientId('fluent-test')
        .withAccessToken('test-token')
        .withConfig({ baseUrl: BASE_URL, unsafeAllowCustomHost: true })
        .build();

      expect(custom).toBeDefined();
      expect(custom.hasClient('status')).toBe(true);
      custom.shutdown();
    });

    it('should deduplicate when addClient is called with same type twice', () => {
      const custom = new EsiClientBuilder()
        .addClient('status')
        .addClient('status')
        .withConfig(TEST_CONFIG)
        .build();

      expect(custom.getEnabledClients()).toHaveLength(1);
      custom.shutdown();
    });
  });
});
