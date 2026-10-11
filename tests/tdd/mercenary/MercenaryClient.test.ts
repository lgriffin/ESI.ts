import { ApiClient } from '../../../src/core/ApiClient';
import { MercenaryClient } from '../../../src/clients/MercenaryClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import fetchMock from 'jest-fetch-mock';
import { describeClientErrors } from '../helpers/clientErrorTests';

fetchMock.enableMocks();

const config = getConfig();

const rateLimiter = new RateLimiter();
rateLimiter.setTestMode(true);

const client = new ApiClientBuilder()
  .setClientId(config.projectName)
  .setLink(config.link)
  .setAccessToken(process.env.ESI_ACCESS_TOKEN || 'test-token')
  .setRateLimiter(rateLimiter)
  .build();

const mercenaryClient = new MercenaryClient(client);

describe('MercenaryClient', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should get mercenary dens', async () => {
    const mockResponse = {
      mercenary_dens: [{ id: 1046664001933, planet_id: 40009077 }],
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      mercenaryClient.getMercenaryDens(123456),
    );
    expect(result).toEqual(mockResponse);
    expect(result.mercenary_dens[0]!.planet_id).toBe(40009077);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123456/structures/mercenary-dens',
    );
  });

  it('should get mercenary tactical operations', async () => {
    const mockResponse = {
      operations: [
        {
          id: '3f2b7c1e-8d4a-4b6e-9a51-2c7d0e9f4a10',
          mercenary_den_id: 1046664001933,
        },
      ],
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      mercenaryClient.getMercenaryTacticalOperations(123456),
    );
    expect(result).toEqual(mockResponse);
    expect(result.operations[0]!.mercenary_den_id).toBe(1046664001933);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123456/mercenary-tactical-operations',
    );
  });

  it('should send auth headers for mercenary dens', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ mercenary_dens: [] }));

    await getBody(() => mercenaryClient.getMercenaryDens(123456));

    const requestInit = fetchMock.mock.calls[0][1];
    expect(requestInit?.headers).toBeDefined();
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers['Authorization']).toMatch(/^Bearer /);
  });

  it('should send auth headers for mercenary tactical operations', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ operations: [] }));

    await getBody(() => mercenaryClient.getMercenaryTacticalOperations(123456));

    const requestInit = fetchMock.mock.calls[0][1];
    expect(requestInit?.headers).toBeDefined();
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers['Authorization']).toMatch(/^Bearer /);
  });

  it('should get mercenary den detail', async () => {
    const mockResponse = {
      id: 5001,
      type_id: 81080,
      state: 'Running',
      skyhook: {
        id: 200000001,
        planet_id: 40000002,
        corporation_id: 98000002,
      },
      infomorphs: { amount: 100 },
      evolution: {
        development: { level: 'Level3', amount: 75 },
        anarchy: { level: 'Level2', amount: 40 },
      },
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      mercenaryClient.getMercenaryDenDetail(123456, 5001),
    );
    expect(result).toHaveProperty('id', 5001);
    expect(result).toHaveProperty('state', 'Running');
    expect(result.skyhook).toHaveProperty('planet_id', 40000002);
    expect(result.infomorphs).toHaveProperty('amount', 100);
    expect(result.evolution.development).toHaveProperty('level', 'Level3');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123456/structures/mercenary-dens/5001',
    );
  });

  it('should get mercenary tactical operation detail', async () => {
    const mockResponse = {
      id: '3868eaed-8278-4cb7-9709-7d7de9c20dc7',
      mercenary_den_id: 5001,
      state: 'Available',
      dungeon_type_id: 12367,
      expires: '2026-05-20T22:00:00Z',
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      mercenaryClient.getMercenaryTacticalOperationDetail(
        123456,
        '3868eaed-8278-4cb7-9709-7d7de9c20dc7',
      ),
    );
    expect(result).toHaveProperty('id', '3868eaed-8278-4cb7-9709-7d7de9c20dc7');
    expect(result).toHaveProperty('state', 'Available');
    expect(result).toHaveProperty('dungeon_type_id', 12367);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123456/mercenary-tactical-operations/3868eaed-8278-4cb7-9709-7d7de9c20dc7',
    );
  });

  it('should send auth headers for mercenary den detail', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        id: 5001,
        type_id: 81080,
        state: 'Running',
        skyhook: { id: 1, planet_id: 1, corporation_id: 1 },
        infomorphs: { amount: 0 },
        evolution: {
          development: { level: 'Level0', amount: 0 },
          anarchy: { level: 'Level0', amount: 0 },
        },
      }),
    );

    await getBody(() => mercenaryClient.getMercenaryDenDetail(123456, 5001));

    const requestInit = fetchMock.mock.calls[0][1];
    expect(requestInit?.headers).toBeDefined();
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers['Authorization']).toMatch(/^Bearer /);
  });

  it('should send auth headers for mercenary tactical operation detail', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        id: 'abc-123',
        mercenary_den_id: 5001,
        state: 'Available',
        dungeon_type_id: 12367,
        expires: '2026-05-20T22:00:00Z',
      }),
    );

    await getBody(() =>
      mercenaryClient.getMercenaryTacticalOperationDetail(123456, 'abc-123'),
    );

    const requestInit = fetchMock.mock.calls[0][1];
    expect(requestInit?.headers).toBeDefined();
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers['Authorization']).toMatch(/^Bearer /);
  });

  describeClientErrors('MercenaryClient', (apiClient) =>
    new MercenaryClient(apiClient).getMercenaryDens(123456),
  );
});
