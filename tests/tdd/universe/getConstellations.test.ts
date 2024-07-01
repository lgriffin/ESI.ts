import { UniverseConstellationsApi } from '../../../src/api/universe/getConstellations';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseConstellationsApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeConstellationsApi = new UniverseConstellationsApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getConstellations', async () => {
        const mockResponse = [{ constellation_id: 1, name: 'Constellation 1' }, { constellation_id: 2, name: 'Constellation 2' }];
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await universeConstellationsApi.getConstellations();
        expect(Array.isArray(result)).toBe(true);
        result.forEach((constellation: any) => {
            expect(constellation).toHaveProperty('constellation_id');
            expect(typeof constellation.constellation_id).toBe('number');
            expect(constellation).toHaveProperty('name');
            expect(typeof constellation.name).toBe('string');
        });
    });
});
