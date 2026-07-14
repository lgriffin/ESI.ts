import { WarsClient } from '../../../src/clients/WarsClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';
import { describeClientErrors } from '../helpers/clientErrorTests';

fetchMock.enableMocks();

const config = getConfig();
const client = new ApiClientBuilder()
  .setClientId(config.projectName)
  .setLink(config.link)
  .setAccessToken(process.env.ESI_ACCESS_TOKEN || 'test-token')
  .build();

const warsClient = new WarsClient(client);

describe('WarsClient', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should return valid wars', async () => {
    const mockResponse = [1, 2, 3];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() => warsClient.getWars());

    expect(Array.isArray(result)).toBe(true);
    result.forEach((warId: any) => {
      expect(typeof warId).toBe('number');
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/wars',
    );
  });

  it('should return valid war by ID', async () => {
    const mockResponse = {
      id: 1,
      war_id: 1,
      declared: '2024-06-25T00:00:00Z',
      mutual: false,
      open_for_allies: true,
      started: '2024-06-26T00:00:00Z',
      aggressor: {
        corporation_id: 98000001,
        isk_destroyed: 125000000.5,
        ships_killed: 42,
      },
      defender: {
        corporation_id: 98000002,
        isk_destroyed: 78000000.25,
        ships_killed: 15,
      },
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() => warsClient.getWarById(1));

    expect(result).toHaveProperty('war_id');
    expect(result.war_id).toBe(1);
    expect(result).toHaveProperty('declared');
    expect(typeof result.declared).toBe('string');
    expect(result).toHaveProperty('started');
    expect(typeof result.started).toBe('string');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/wars/1',
    );
  });

  it('should return valid war killmails', async () => {
    const mockResponse = [
      {
        killmail_hash: 'abc123',
        killmail_id: 12345,
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() => warsClient.getWarKillmails(1));

    expect(Array.isArray(result)).toBe(true);
    result.forEach((killmail: any) => {
      expect(killmail).toHaveProperty('killmail_hash');
      expect(typeof killmail.killmail_hash).toBe('string');
      expect(killmail).toHaveProperty('killmail_id');
      expect(typeof killmail.killmail_id).toBe('number');
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/wars/1/killmails',
    );
  });

  describeClientErrors('WarsClient', () => warsClient.getWars());
});
