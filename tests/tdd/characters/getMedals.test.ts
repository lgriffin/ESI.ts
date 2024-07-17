import { GetMedalsApi } from '../../../src/api/characters/getMedals';
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

const medalsApi = new GetMedalsApi(client);

describe('GetMedalsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for medals', async () => {
        const mockResponse = [
            {
                medal_id: 1,
                reason: 'Bravery',
                status: 'public'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await medalsApi.getMedals(123456);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((medal) => {
            expect(medal).toHaveProperty('medal_id');
            expect(medal).toHaveProperty('reason');
            expect(medal).toHaveProperty('status');
        });
    });
});
