import { UniverseRegionsApi } from '../../../src/api/universe/getRegions';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseRegionsApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeRegionsApi = new UniverseRegionsApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getRegions', async () => {
        const mockResponse = [10000001, 10000002, 10000003, 10000004, 10000005];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await universeRegionsApi.getRegions() as number[];

        expect(Array.isArray(result)).toBe(true);
        result.forEach((regionId: number) => {
            expect(typeof regionId).toBe('number');
            expect(regionId).toBeGreaterThan(0);
        });
    });
});
