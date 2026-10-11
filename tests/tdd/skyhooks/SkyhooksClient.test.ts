import { ApiClient } from '../../../src/core/ApiClient';
import { SkyhooksClient } from '../../../src/clients/SkyhooksClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';
import { describeClientErrors } from '../helpers/clientErrorTests';
import type { RaidableSkyhooksResponse } from '../../../src';

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
    const mockResponse = {
      sovereignty_hubs: [{ id: 1046664001931, solar_system_id: 30000142 }],
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      authSkyhooksClient.getSovereigntyHubs(98000002),
    );
    expect(result).toEqual(mockResponse);
    expect(result.sovereignty_hubs[0]!.solar_system_id).toBe(30000142);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/corporations/98000002/structures/sovereignty-hubs',
    );
  });

  it('should get orbital skyhooks', async () => {
    const mockResponse = {
      skyhooks: [{ id: 1046664001932, planet_id: 40009077 }],
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      authSkyhooksClient.getOrbitalSkyhooks(98000002),
    );
    expect(result).toEqual(mockResponse);
    expect(result.skyhooks[0]!.planet_id).toBe(40009077);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/corporations/98000002/structures/skyhooks',
    );
  });

  it('should get raidable skyhooks', async () => {
    const mockResponse: RaidableSkyhooksResponse = {
      skyhooks: [
        {
          planet_id: 40229601,
          solar_system_id: 30003618,
          theft_vulnerability: {
            start: '2026-09-17T12:14:02Z',
            end: '2026-09-17T14:14:02Z',
          },
        },
      ],
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      unauthSkyhooksClient.getRaidableSkyhooks(),
    );
    expect(result).toEqual(mockResponse);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/skyhooks/raidable',
    );
  });

  it('should send auth headers for sovereignty hubs', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ sovereignty_hubs: [] }));

    await getBody(() => authSkyhooksClient.getSovereigntyHubs(98000002));

    const requestInit = fetchMock.mock.calls[0][1];
    expect(requestInit?.headers).toBeDefined();
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers['Authorization']).toMatch(/^Bearer /);
  });

  it('should send auth headers for orbital skyhooks', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ skyhooks: [] }));

    await getBody(() => authSkyhooksClient.getOrbitalSkyhooks(98000002));

    const requestInit = fetchMock.mock.calls[0][1];
    expect(requestInit?.headers).toBeDefined();
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers['Authorization']).toMatch(/^Bearer /);
  });

  it('should get skyhook detail', async () => {
    const mockResponse = {
      id: 200000001,
      planet_id: 40000002,
      state: 'ShieldVulnerable',
      is_active: true,
      effective_workforce: 1000,
      reagents: [
        {
          type_id: 81143,
          secured_stock: 1000,
          unsecured_stock: 300,
          last_cycle: '2026-05-20T12:00:00Z',
        },
      ],
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      authSkyhooksClient.getSkyhookDetail(98000002, 200000001),
    );
    expect(result).toHaveProperty('id', 200000001);
    expect(result).toHaveProperty('state', 'ShieldVulnerable');
    expect(result).toHaveProperty('is_active', true);
    expect(result.reagents).toHaveLength(1);
    expect(result.reagents[0]).toHaveProperty('type_id', 81143);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/corporations/98000002/structures/skyhooks/200000001',
    );
  });

  it('should get sovereignty hub detail', async () => {
    const mockResponse = {
      id: 100000001,
      solar_system_id: 30000142,
      upgrades: [{ type_id: 32458, power_state: 'Online' }],
      reagent_bay: {
        last_updated: '2026-05-20T12:00:00Z',
        reagents: [{ type_id: 81143, amount: 500, burning_per_hour: 10 }],
      },
      resources: {
        power: { available: 100, allocated: 60 },
        workforce: { available: 1000, allocated: 750 },
      },
      workforce_transport: {
        configuration: { transit: true },
        state: { transit: true },
      },
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      authSkyhooksClient.getSovereigntyHubDetail(98000002, 100000001),
    );
    expect(result).toHaveProperty('id', 100000001);
    expect(result).toHaveProperty('solar_system_id', 30000142);
    expect(result.upgrades).toHaveLength(1);
    expect(result.upgrades[0]).toHaveProperty('power_state', 'Online');
    expect(result.reagent_bay.reagents).toHaveLength(1);
    expect(result.resources.power.allocated).toBe(60);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/corporations/98000002/structures/sovereignty-hubs/100000001',
    );
  });

  it('should send auth headers for skyhook detail', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        id: 200000001,
        planet_id: 40000002,
        state: 'ShieldVulnerable',
        is_active: true,
      }),
    );

    await getBody(() =>
      authSkyhooksClient.getSkyhookDetail(98000002, 200000001),
    );

    const requestInit = fetchMock.mock.calls[0][1];
    expect(requestInit?.headers).toBeDefined();
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers['Authorization']).toMatch(/^Bearer /);
  });

  it('should send auth headers for sovereignty hub detail', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        id: 100000001,
        solar_system_id: 30000142,
        upgrades: [],
        reagent_bay: { last_updated: '2026-05-20T12:00:00Z', reagents: [] },
        resources: {
          power: { available: 0, allocated: 0 },
          workforce: { available: 0, allocated: 0 },
        },
        workforce_transport: { configuration: {}, state: {} },
      }),
    );

    await getBody(() =>
      authSkyhooksClient.getSovereigntyHubDetail(98000002, 100000001),
    );

    const requestInit = fetchMock.mock.calls[0][1];
    expect(requestInit?.headers).toBeDefined();
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers['Authorization']).toMatch(/^Bearer /);
  });

  describeClientErrors('SkyhooksClient', (apiClient) =>
    new SkyhooksClient(apiClient).getSovereigntyHubs(98000002),
  );
});
