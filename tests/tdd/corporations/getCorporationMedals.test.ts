import { GetCorporationMedalsApi } from '../../../src/api/corporations/getCorporationMedals';
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

const corporationMedalsApi = new GetCorporationMedalsApi(client);

describe('GetCorporationMedalsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation medals', async () => {
        const mockResponse = [
            {
                medal_id: 1,
                title: 'Medal Title',
                description: 'Medal Description',
                creator_id: 12345,
                created_at: '2024-07-01T12:00:00Z',
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationMedalsApi.getCorporationMedals(12345);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((medal: { medal_id: number; title: string; description: string; creator_id: number; created_at: string }) => {
            expect(medal).toHaveProperty('medal_id');
            expect(typeof medal.medal_id).toBe('number');
            expect(medal).toHaveProperty('title');
            expect(typeof medal.title).toBe('string');
            expect(medal).toHaveProperty('description');
            expect(typeof medal.description).toBe('string');
            expect(medal).toHaveProperty('creator_id');
            expect(typeof medal.creator_id).toBe('number');
            expect(medal).toHaveProperty('created_at');
            expect(typeof medal.created_at).toBe('string');
        });
    });
});
