import { UniverseConstellationByIdApi } from '../../../src/api/universe/getConstellationById';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseConstellationByIdApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeConstellationByIdApi = new UniverseConstellationByIdApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getConstellationById', async () => {
        const mockResponse = { constellation_id: 1, name: 'Constellation 1', systems: [1, 2, 3] };
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type ConstellationResponse = {
            constellation_id: number;
            name: string;
            systems: number[];
        };

        const result = await universeConstellationByIdApi.getConstellationById(1) as ConstellationResponse;
        expect(result).toHaveProperty('constellation_id');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('systems');
        expect(Array.isArray(result.systems)).toBe(true);
    });
});
