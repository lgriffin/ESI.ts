// tests/tdd/status/getStatus.test.ts
import { StatusApi } from '../../../src/api/status/getStatus';
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

type StatusResponse = {
    players: {
        online: number;
    };
    start_time: string;
    server_version: string;
};

describe('StatusApi', () => {
    let statusApi: StatusApi;

    beforeEach(() => {
        fetchMock.resetMocks();
        statusApi = new StatusApi(client);
    });

    it('should return the server status', async () => {
        const mockResponse: StatusResponse = {
            players: {
                online: 12345
            },
            start_time: '2024-07-01T18:57:11Z',
            server_version: '1.2.3'
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result: StatusResponse = await statusApi.getStatus();

        expect(result).toHaveProperty('players');
        expect(result.players.online).toBe(12345);
        expect(result).toHaveProperty('start_time');
        expect(result.start_time).toBe('2024-07-01T18:57:11Z');
        expect(result).toHaveProperty('server_version');
        expect(result.server_version).toBe('1.2.3');
    });
});
