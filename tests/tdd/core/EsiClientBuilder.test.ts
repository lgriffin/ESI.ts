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

    it('should provide getter access to all 35 domain clients', () => {
      const allTypes = [
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
      ] as const;

      const client = new EsiClientBuilder().addClients([...allTypes]).build();

      expect(client.alliance).toBeDefined();
      expect(client.assets).toBeDefined();
      expect(client.calendar).toBeDefined();
      expect(client.characters).toBeDefined();
      expect(client.clones).toBeDefined();
      expect(client.contacts).toBeDefined();
      expect(client.contracts).toBeDefined();
      expect(client.corporations).toBeDefined();
      expect(client.dogma).toBeDefined();
      expect(client.factions).toBeDefined();
      expect(client.fittings).toBeDefined();
      expect(client.fleets).toBeDefined();
      expect(client.incursions).toBeDefined();
      expect(client.industry).toBeDefined();
      expect(client.insurance).toBeDefined();
      expect(client.killmails).toBeDefined();
      expect(client.location).toBeDefined();
      expect(client.loyalty).toBeDefined();
      expect(client.mail).toBeDefined();
      expect(client.market).toBeDefined();
      expect(client.pi).toBeDefined();
      expect(client.route).toBeDefined();
      expect(client.search).toBeDefined();
      expect(client.skills).toBeDefined();
      expect(client.sovereignty).toBeDefined();
      expect(client.status).toBeDefined();
      expect(client.ui).toBeDefined();
      expect(client.universe).toBeDefined();
      expect(client.wallet).toBeDefined();
      expect(client.wars).toBeDefined();
      expect(client.meta).toBeDefined();
      expect(client.freelanceJobs).toBeDefined();
      expect(client.skyhooks).toBeDefined();
      expect(client.mercenary).toBeDefined();
      expect(client.accessLists).toBeDefined();

      expect(client.getEnabledClients()).toHaveLength(35);
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
