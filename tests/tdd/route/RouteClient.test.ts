import { RouteClient } from '../../../src/clients/RouteClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const config = getConfig();

const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

const routeClient = new RouteClient(client);

describe('RouteClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid route information from client', async () => {
        const mockResponse = [
            30000142,
            30000144
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await routeClient.getRoute(30000142, 30000144);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((systemId: number) => {
            expect(typeof systemId).toBe('number');
        });
    });
});
