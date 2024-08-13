import { UniverseRegionByIdApi } from '../../../src/api/universe/getRegionById';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseRegionByIdApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeRegionByIdApi = new UniverseRegionByIdApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getRegionById', async () => {
        const mockResponse = {
            region_id: 10000001,
            name: 'The Forge',
            constellations: [20000001, 20000002],
            description: 'A region description',
            systems: [30000001, 30000002]
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type RegionResponse = {
            region_id: number;
            name: string;
            constellations: number[];
            description: string;
            systems: number[];
        };

        const result = await getBody(() => universeRegionByIdApi.getRegionById(10000001)) as RegionResponse;

        expect(result).toHaveProperty('region_id');
        expect(typeof result.region_id).toBe('number');
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
        expect(result).toHaveProperty('constellations');
        expect(Array.isArray(result.constellations)).toBe(true);
        expect(result).toHaveProperty('description');
        expect(typeof result.description).toBe('string');
        expect(result).toHaveProperty('systems');
        expect(Array.isArray(result.systems)).toBe(true);
    });
});
