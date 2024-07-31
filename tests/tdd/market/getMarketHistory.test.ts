import { getMarketHistory } from '../../../src/api/market/getMarketHistory';
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

const marketHistoryApi = new getMarketHistory(client);

describe('GetMarketHistoryApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return market history', async () => {
        const mockResponse = [
            {
                date: '2023-01-01',
                order_count: 10,
                volume: 1000,
                highest: 150.0,
                lowest: 100.0,
                average: 120.0
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await marketHistoryApi.getMarketHistory(10000002, 34);

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(history => {
            expect(history).toHaveProperty('date');
            expect(history).toHaveProperty('order_count');
            expect(history).toHaveProperty('volume');
            expect(history).toHaveProperty('highest');
            expect(history).toHaveProperty('lowest');
            expect(history).toHaveProperty('average');
        });
    });
});
