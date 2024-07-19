import { GetCorporationAllianceHistoryApi } from '../../../src/api/corporations/getCorporationAllianceHistory';
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

const allianceHistoryApi = new GetCorporationAllianceHistoryApi(client);

describe('GetCorporationAllianceHistoryApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for alliance history', async () => {
        const mockResponse = [
            {
                alliance_id: 12345,
                start_date: '2023-01-01T00:00:00Z',
                end_date: '2024-01-01T00:00:00Z',
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await allianceHistoryApi.getCorporationAllianceHistory(12345);

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(history => {
            expect(history).toHaveProperty('alliance_id');
            expect(typeof history.alliance_id).toBe('number');
            expect(history).toHaveProperty('start_date');
            expect(typeof history.start_date).toBe('string');
            expect(history).toHaveProperty('end_date');
            expect(typeof history.end_date).toBe('string');
        });
    });
});
