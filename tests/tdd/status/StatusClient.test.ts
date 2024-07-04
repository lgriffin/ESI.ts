import { StatusClient } from '../../../src/clients/StatusClient';
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

describe('StatusClient', () => {
    let statusClient: StatusClient;

    beforeEach(() => {
        fetchMock.resetMocks();
        statusClient = new StatusClient(client);
    });

    it('should return the server status', async () => {
        const mockResponse = {
            players: 12345,
            start_time: '2024-07-01T18:57:11Z',
            server_version: '1.2.3',
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await statusClient.getStatus();

        expect(result.players).toBe(12345);
        expect(result.start_time).toBe('2024-07-01T18:57:11Z');
        expect(result.server_version).toBe('1.2.3');
    });
});
