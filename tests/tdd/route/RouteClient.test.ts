import { RouteClient } from '../../../src/clients/RouteClient';
import { ApiClient } from '../../../src/core/ApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { resetETagCache } from '../../../src/core/ApiRequestHandler';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('RouteClient', () => {
    let client: RouteClient;

    beforeEach(() => {
        fetchMock.resetMocks();
        resetETagCache();
        const rateLimiter = RateLimiter.getInstance();
        rateLimiter.reset();
        rateLimiter.setTestMode(true);
        const apiClient = new ApiClient('test', 'https://esi.evetech.net', undefined);
        client = new RouteClient(apiClient);
    });

    it('should return a route as an array of system IDs', async () => {
        const mockResponse = { route: [30000142, 30000138, 30000144] };
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await client.getRoute(30000142, 30000144);

        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual([30000142, 30000138, 30000144]);
    });

    it('should use POST method', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ route: [30000142, 30000144] }));

        await client.getRoute(30000142, 30000144);

        expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
    });

    it('should include origin and destination in the URL path', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ route: [30000142, 30002187] }));

        await client.getRoute(30000142, 30002187);

        expect(fetchMock.mock.calls[0][0]).toBe(
            'https://esi.evetech.net/route/30000142/30002187'
        );
    });

    it('should send route options in the request body', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ route: [30000142, 30002187] }));

        await client.getRoute(30000142, 30002187, {
            preference: 'Safer',
            avoid_systems: [30003504],
            security_penalty: 75,
        });

        const sentBody = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
        expect(sentBody.preference).toBe('Safer');
        expect(sentBody.avoid_systems).toEqual([30003504]);
        expect(sentBody.security_penalty).toBe(75);
    });

    it('should send connections in the request body', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ route: [30000142, 30000144, 30002187] }));

        await client.getRoute(30000142, 30002187, {
            connections: [{ from: 30000144, to: 30002187 }],
        });

        const sentBody = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
        expect(sentBody.connections).toEqual([{ from: 30000144, to: 30002187 }]);
    });

    it('should send empty body when no options provided', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ route: [30000142, 30000144] }));

        await client.getRoute(30000142, 30000144);

        const sentBody = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
        expect(sentBody).toEqual({});
    });
});
