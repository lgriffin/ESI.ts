import { UniverseAsteroidBeltApi } from '../../../src/api/universe/getAsteroidBeltInfo';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseAsteroidBeltApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeAsteroidBeltApi = new UniverseAsteroidBeltApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getAsteroidBeltInfo', async () => {
        const mockResponse = { asteroid_belt_id: 1, name: 'Asteroid Belt 1' };
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => universeAsteroidBeltApi.getAsteroidBeltInfo(1));
        expect(result).toHaveProperty('asteroid_belt_id');
        expect(result).toHaveProperty('name');
    });
});
