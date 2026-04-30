import { ClonesClient } from '../../../src/clients/ClonesClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const config = getConfig();

const client = new ApiClientBuilder()
  .setClientId(config.projectName)
  .setLink(config.link)
  .setAccessToken(process.env.ESI_ACCESS_TOKEN || 'test-token')
  .build();

const clonesClient = new ClonesClient(client);

describe('ClonesClient', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should return valid structure for clones', async () => {
    const mockResponse = {
      home_location: {
        location_id: 123456,
        location_type: 'station',
      },
      jump_clones: [
        {
          implants: [1, 2, 3],
          location_id: 654321,
          location_type: 'station',
        },
      ],
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() => clonesClient.getClones(123456789));

    expect(result).toHaveProperty('home_location');
    expect(result.home_location).toHaveProperty('location_id');
    expect(result.home_location).toHaveProperty('location_type');
    expect(result).toHaveProperty('jump_clones');
    expect(Array.isArray(result.jump_clones)).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123456789/clones',
    );
  });

  it('should return valid structure for implants', async () => {
    const mockResponse = [1, 2, 3];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() => clonesClient.getImplants(123456789));

    expect(Array.isArray(result)).toBe(true);
    result.forEach((implant: number) => {
      expect(typeof implant).toBe('number');
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123456789/implants',
    );
  });
});
