import { UniverseTypesApi } from '../../../src/api/universe/getTypes';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseTypesApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeTypesApi = new UniverseTypesApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getTypes', async () => {
        const mockResponse = [12345, 67890, 11223];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => universeTypesApi.getTypes()) as number[];

        expect(Array.isArray(result)).toBe(true);
        result.forEach((id: number) => {
            expect(typeof id).toBe('number');
        });
    });
});
