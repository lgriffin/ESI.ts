import { RouteClient } from '../../../src/clients/RouteClient';
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
const routeClient = new RouteClient(routeApi);

describe('RouteClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid route information from client', async () => {
        const mockResponse = {
            route: [
                {
                    system_id: 30000142,
                    security_status: 0.9
                },
                {
                    system_id: 30000144,
                    security_status: 0.8
                }
            ]
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type Route = {
            system_id: number;
            security_status: number;
        };

        const result = await routeClient.getRoute(30000142, 30000144) as Route[];

        expect(Array.isArray(result)).toBe(true);
        result.forEach((routeSegment: Route) => {
            expect(routeSegment).toHaveProperty('system_id');
            expect(typeof routeSegment.system_id).toBe('number');
            expect(routeSegment).toHaveProperty('security_status');
            expect(typeof routeSegment.security_status).toBe('number');
        });
    });
});
