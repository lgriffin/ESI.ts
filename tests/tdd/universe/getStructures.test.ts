import { UniverseStructuresApi } from '../../../src/api/universe/getStructures';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseStructuresApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeStructuresApi = new UniverseStructuresApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getStructures', async () => {
        const mockResponse = [900001, 900002, 900003];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await universeStructuresApi.getStructures() as number[];

        expect(Array.isArray(result)).toBe(true);
        result.forEach((id: number) => {
            expect(typeof id).toBe('number');
        });
    });
});
