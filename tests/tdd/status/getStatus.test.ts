// tests/tdd/status/getStatus.test.ts
import { GetStatusApi } from '../../../src/api/status/getStatus';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('GetStatusApi', () => {
    let statusApi: GetStatusApi;

    beforeEach(() => {
        fetchMock.resetMocks();
        
        const config = getConfig();
        const client = new ApiClientBuilder()
            .setClientId(config.projectName)
            .setLink(config.link)
            .setAccessToken(config.authToken || undefined)
            .build();

        statusApi = new GetStatusApi(client);
    });

    it('should return valid status information', async () => {
        const mockResponse = {
            players: {
                online: 1000
            },
            start_time: '2024-07-01T12:00:00Z',
            server_version: '1.2.3'
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await statusApi.getStatus();

        expect(result).toHaveProperty('players');
        expect(typeof result.players).toBe('object');
        expect(result.players).toHaveProperty('online');
        expect(typeof result.players.online).toBe('number');
        expect(result).toHaveProperty('start_time');
        expect(typeof result.start_time).toBe('string');
        expect(result).toHaveProperty('server_version');
        expect(typeof result.server_version).toBe('string');
    });
});
