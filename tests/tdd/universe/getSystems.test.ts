import { UniverseSystemsApi } from '../../../src/api/universe/getSystems';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseSystemsApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeSystemsApi = new UniverseSystemsApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getSystems', async () => {
        const mockResponse = [30000142, 30000144, 30000146];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => universeSystemsApi.getSystems()) as number[];

        expect(Array.isArray(result)).toBe(true);
        result.forEach((id: number) => {
            expect(typeof id).toBe('number');
        });
    });
});
