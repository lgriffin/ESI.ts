import { GetCorporationHistoryApi } from '../../../src/api/characters/getCorporationHistory';
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

const corporationHistoryApi = new GetCorporationHistoryApi(client);

describe('GetCorporationHistoryApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation history', async () => {
        const mockResponse = [
            {
                corporation_id: 123456,
                start_date: '2024-01-01T00:00:00Z',
                record_id: 654321,
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationHistoryApi.getCorporationHistory(123456);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((history) => {
            expect(history).toHaveProperty('corporation_id');
            expect(history).toHaveProperty('start_date');
            expect(history).toHaveProperty('record_id');
        });
    });
});
