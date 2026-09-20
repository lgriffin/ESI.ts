import { EsiClient } from '../../src/EsiClient';
import { EsiError } from '../../src/core/util/error';

jest.setTimeout(60000);

const LIVE_TESTS_ENABLED = process.env.ESI_LIVE_TESTS === 'true';
const describeIfLive = LIVE_TESTS_ENABLED ? describe : describe.skip;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

describeIfLive('Client Integration: EsiClient against live ESI', () => {
  let client: EsiClient;

  beforeAll(() => {
    client = new EsiClient({ clientId: 'esi-ts-integration-test' });
  });

  afterAll(() => {
    client.shutdown();
  });

  describe('EsiClient -> Status', () => {
    it('should return server status with correct types', async () => {
      const status = await client.status.getStatus();

      expect(status).toHaveProperty('players');
      expect(status).toHaveProperty('server_version');
      expect(status).toHaveProperty('start_time');
      expect(typeof status.players).toBe('number');
      expect(typeof status.server_version).toBe('string');
      expect(typeof status.start_time).toBe('string');
    });
  });

  describe('EsiClient -> Market Prices', () => {
    beforeAll(() => delay(300));

    it('should return an array of market prices with type_id fields', async () => {
      const prices = await client.market.getMarketPrices();

      expect(Array.isArray(prices)).toBe(true);
      expect(prices.length).toBeGreaterThan(0);
      expect(prices[0]).toHaveProperty('type_id');
      expect(typeof prices[0].type_id).toBe('number');
    });
  });

  describe('EsiClient -> Alliance Info', () => {
    beforeAll(() => delay(300));

    it('should return all alliances as an array of numbers', async () => {
      const alliances = await client.alliance.getAlliances();

      expect(Array.isArray(alliances)).toBe(true);
      expect(alliances.length).toBeGreaterThan(0);
      expect(typeof alliances[0]).toBe('number');
    });

    it('should return alliance info with name and ticker for a known alliance', async () => {
      await delay(300);
      const info = await client.alliance.getAllianceById(99000006);

      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('ticker');
      expect(typeof info.name).toBe('string');
      expect(typeof info.ticker).toBe('string');
    });
  });

  describe('EsiClient -> Universe Type', () => {
    beforeAll(() => delay(300));

    it('should return Tritanium type info with name, description, and type_id', async () => {
      const typeInfo = await client.universe.getTypeById(34);

      expect(typeInfo).toHaveProperty('name');
      expect(typeInfo).toHaveProperty('description');
      expect(typeInfo).toHaveProperty('type_id');
      expect(typeof typeInfo.name).toBe('string');
      expect(typeof typeInfo.description).toBe('string');
      expect(typeInfo.type_id).toBe(34);
    });
  });

  describe('ETag Cache Round-Trip', () => {
    let cachedClient: EsiClient;

    beforeAll(() => {
      cachedClient = new EsiClient({
        clientId: 'esi-ts-integration-etag-test',
        enableETagCache: true,
        etagCacheConfig: { maxEntries: 100, defaultTtl: 60000 },
      });
    });

    afterAll(() => {
      cachedClient.shutdown();
    });

    it('should populate cache after two calls to the same endpoint', async () => {
      await cachedClient.status.getStatus();
      await cachedClient.status.getStatus();

      const stats = cachedClient.getCacheStats();
      expect(stats).not.toBeNull();
      expect(stats!.totalEntries).toBeGreaterThan(0);
    });
  });

  describe('Rate Limit Tracking', () => {
    beforeAll(() => delay(300));

    it('should successfully make a request with rate limiter consuming headers', async () => {
      const result = await client.status.getStatus();

      // The request succeeds, which means the rate limiter accepted the
      // response and consumed the x-ratelimit-* headers without blocking.
      expect(result).toHaveProperty('players');
      expect(typeof result.players).toBe('number');
    });
  });

  describe('Pagination Assembly', () => {
    beforeAll(() => delay(300));

    it('should assemble all pages of universe types into a single array with >1000 entries', async () => {
      const types = await client.universe.getTypes();

      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(1000);
      expect(typeof types[0]).toBe('number');
    }, 60000);
  });

  describe('Error Handling', () => {
    beforeAll(() => delay(300));

    it('should throw EsiError with statusCode 404 for a non-existent alliance', async () => {
      try {
        await client.alliance.getAllianceById(999999999);
        fail('Expected an EsiError to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(EsiError);
        expect((e as EsiError).statusCode).toBe(404);
      }
    });
  });

  describe('Route Calculation', () => {
    beforeAll(() => delay(300));

    it('should calculate a route from Jita to Amarr starting with the origin system', async () => {
      const route = await client.route.getRoute(30000142, 30002187);

      expect(Array.isArray(route)).toBe(true);
      expect(route.length).toBeGreaterThan(1);
      expect(route[0]).toBe(30000142);
    });
  });

  describe('Diagnostics', () => {
    beforeAll(() => delay(300));

    it('should return populated diagnostics after making requests', async () => {
      // Make a request to ensure there is data to report
      await client.status.getStatus();

      const diag = client.diagnostics;
      const cacheStats = diag.getCacheStats();

      expect(cacheStats).not.toBeNull();
      expect(cacheStats).toHaveProperty('totalEntries');
      expect(cacheStats).toHaveProperty('hits');
      expect(cacheStats).toHaveProperty('misses');
      expect(typeof cacheStats!.totalEntries).toBe('number');
    });
  });
});
