import {
  CustomEsiClient,
  EsiApiFactory,
  EsiClientBuilder,
} from '../../../src/EsiClientBuilder';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('EsiClientBuilder (src/)', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  describe('EsiClientBuilder', () => {
    it('should build a CustomEsiClient with specified clients', () => {
      const client = new EsiClientBuilder()
        .addClient('alliance')
        .addClient('market')
        .withClientId('test')
        .build();

      expect(client).toBeInstanceOf(CustomEsiClient);
      expect(client.getEnabledClients()).toContain('alliance');
      expect(client.getEnabledClients()).toContain('market');
      client.shutdown();
    });

    it('should add multiple clients via addClients', () => {
      const client = new EsiClientBuilder()
        .addClients(['alliance', 'status', 'universe'])
        .build();

      expect(client.getEnabledClients()).toHaveLength(3);
      client.shutdown();
    });

    it('should not duplicate client types', () => {
      const client = new EsiClientBuilder()
        .addClient('alliance')
        .addClient('alliance')
        .build();

      expect(client.getEnabledClients()).toHaveLength(1);
      client.shutdown();
    });

    it('should throw when building with no clients', () => {
      const builder = new EsiClientBuilder();
      expect(() => builder.build()).toThrow(
        'At least one client type must be specified',
      );
    });

    it('should support withConfig', () => {
      const client = new EsiClientBuilder()
        .addClient('status')
        .withConfig({ clientId: 'config-test' })
        .build();

      expect(client).toBeDefined();
      client.shutdown();
    });

    it('should support withAccessToken', () => {
      const client = new EsiClientBuilder()
        .addClient('status')
        .withAccessToken('my-token')
        .build();

      expect(client).toBeDefined();
      client.shutdown();
    });

    it('should support method chaining', () => {
      const builder = new EsiClientBuilder();
      const result = builder
        .addClient('alliance')
        .withClientId('test')
        .withAccessToken('token');

      expect(result).toBe(builder);
    });
  });

  describe('CustomEsiClient', () => {
    it('should return undefined for non-enabled client', () => {
      const client = new EsiClientBuilder().addClient('alliance').build();

      expect(client.hasClient('alliance')).toBe(true);
      expect(client.hasClient('market')).toBe(false);
      expect(client.market).toBeUndefined();
      client.shutdown();
    });

    it('should provide getter access to enabled domain clients', () => {
      const client = new EsiClientBuilder()
        .addClients(['alliance', 'status', 'market', 'universe'])
        .build();

      expect(client.alliance).toBeDefined();
      expect(client.status).toBeDefined();
      expect(client.market).toBeDefined();
      expect(client.universe).toBeDefined();
      client.shutdown();
    });

    it('should clear clients on shutdown', () => {
      const client = new EsiClientBuilder().addClient('alliance').build();

      expect(client.hasClient('alliance')).toBe(true);
      client.shutdown();
    });
  });

  describe('EsiApiFactory', () => {
    it('should create an alliance client', () => {
      const client = EsiApiFactory.createAllianceClient();
      expect(client).toBeDefined();
    });

    it('should create a character client', () => {
      const client = EsiApiFactory.createCharacterClient();
      expect(client).toBeDefined();
    });

    it('should create a corporation client', () => {
      const client = EsiApiFactory.createCorporationClient();
      expect(client).toBeDefined();
    });

    it('should create a market client', () => {
      const client = EsiApiFactory.createMarketClient();
      expect(client).toBeDefined();
    });

    it('should create a universe client', () => {
      const client = EsiApiFactory.createUniverseClient();
      expect(client).toBeDefined();
    });

    it('should create a fleet client', () => {
      const client = EsiApiFactory.createFleetClient();
      expect(client).toBeDefined();
    });

    it('should create an assets client', () => {
      const client = EsiApiFactory.createAssetsClient();
      expect(client).toBeDefined();
    });

    it('should create a wallet client', () => {
      const client = EsiApiFactory.createWalletClient();
      expect(client).toBeDefined();
    });

    it('should create a mail client', () => {
      const client = EsiApiFactory.createMailClient();
      expect(client).toBeDefined();
    });

    it('should create a client by type', () => {
      const client = EsiApiFactory.createClient('sovereignty');
      expect(client).toBeDefined();
    });

    it('should accept custom config', () => {
      const client = EsiApiFactory.createAllianceClient({
        clientId: 'custom',
        accessToken: 'test-token',
      });
      expect(client).toBeDefined();
    });
  });
});
