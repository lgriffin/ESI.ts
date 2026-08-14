import { ApiClient } from '../../../src/core/ApiClient';
import { SkyhooksClient } from '../../../src/clients/SkyhooksClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';
import { describeClientErrors } from '../helpers/clientErrorTests';

fetchMock.enableMocks();

const config = getConfig();

const rateLimiter = new RateLimiter();
rateLimiter.setTestMode(true);

const authClient = new ApiClientBuilder()
  .setClientId(config.projectName)
  .setLink(config.link)
  .setAccessToken(process.env.ESI_ACCESS_TOKEN || 'test-token')
  .setRateLimiter(rateLimiter)
  .build();

const unauthClient = new ApiClientBuilder()
  .setClientId(config.projectName)
  .setLink(config.link)
  .setRateLimiter(rateLimiter)
  .build();

const authSkyhooksClient = new SkyhooksClient(authClient);
const unauthSkyhooksClient = new SkyhooksClient(unauthClient);

describe('SkyhooksClient', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should get sovereignty hubs', async () => {
    const mockResponse = [
      {
        structure_id: 100000001,
        system_id: 30000142,
        corporation_id: 98000002,
        alliance_id: 99000006,
        online: true,
        remaining_reagents: 500,
        installed_upgrades: [1, 2, 3],
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      authSkyhooksClient.getSovereigntyHubs(98000002),
    );
    expect(Array.isArray(result)).toBe(true);
    result.forEach((hub: any) => {
      expect(hub).toHaveProperty('structure_id');
      expect(typeof hub.structure_id).toBe('number');
      expect(hub).toHaveProperty('online');
      expect(typeof hub.online).toBe('boolean');
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/corporations/98000002/structures/sovereignty-hubs',
    );
  });

  it('should get orbital skyhooks', async () => {
    const mockResponse = [
      {
        structure_id: 200000001,
        system_id: 30000142,
        corporation_id: 98000002,
        alliance_id: 99000006,
        online: true,
        reagent_silo_capacity: 1000,
        reagent_silo_level: 750,
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      authSkyhooksClient.getOrbitalSkyhooks(98000002),
    );
    expect(Array.isArray(result)).toBe(true);
    result.forEach((skyhook: any) => {
      expect(skyhook).toHaveProperty('structure_id');
      expect(typeof skyhook.structure_id).toBe('number');
      expect(skyhook).toHaveProperty('online');
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/corporations/98000002/structures/skyhooks',
    );
  });

  it('should get raidable skyhooks', async () => {
    const mockResponse = [
      {
        structure_id: 200000001,
        system_id: 30000142,
        corporation_id: 98000002,
        alliance_id: 99000006,
        raidable_at: '2026-05-20T12:00:00Z',
        is_raidable: true,
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      unauthSkyhooksClient.getRaidableSkyhooks(),
    );
    expect(Array.isArray(result)).toBe(true);
    result.forEach((skyhook: any) => {
      expect(skyhook).toHaveProperty('structure_id');
      expect(typeof skyhook.structure_id).toBe('number');
      expect(skyhook).toHaveProperty('is_raidable');
      expect(typeof skyhook.is_raidable).toBe('boolean');
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/skyhooks/raidable',
    );
  });

  it('should send auth headers for sovereignty hubs', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([]));

    await getBody(() => authSkyhooksClient.getSovereigntyHubs(98000002));

    const requestInit = fetchMock.mock.calls[0][1];
    expect(requestInit?.headers).toBeDefined();
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers['Authorization']).toMatch(/^Bearer /);
  });

  it('should send auth headers for orbital skyhooks', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([]));

    await getBody(() => authSkyhooksClient.getOrbitalSkyhooks(98000002));

    const requestInit = fetchMock.mock.calls[0][1];
    expect(requestInit?.headers).toBeDefined();
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers['Authorization']).toMatch(/^Bearer /);
  });

  describeClientErrors('SkyhooksClient', () =>
    authSkyhooksClient.getSovereigntyHubs(98000002),
  );
});
