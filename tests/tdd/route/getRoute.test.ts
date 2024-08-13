import { RouteApi } from '../../../src/api/route/getRoute';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const config = getConfig();

const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined) // Allow undefined token
    .build();

const routeApi = new RouteApi(client);

describe('RouteApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid route information', async () => {
        const mockResponse = [30000142, 30000144];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => routeApi.getRoute(30000142, 30000144));

        expect(Array.isArray(result)).toBe(true);
        if (Array.isArray(result)) {
            result.forEach((systemId: number) => {
                expect(typeof systemId).toBe('number');
            });
        }
    });
});
