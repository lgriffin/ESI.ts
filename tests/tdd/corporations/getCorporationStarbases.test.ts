import { GetCorporationStarbasesApi } from '../../../src/api/corporations/getCorporationStarbases';
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

const corporationStarbasesApi = new GetCorporationStarbasesApi(client);

describe('GetCorporationStarbasesApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation starbases', async () => {
        const mockResponse = [
            {
                starbase_id: 12345,
                type_id: 67890,
                system_id: 54321,
                moon_id: 98765,
                state: 'online',
                unanchor_at: '2024-07-01T12:00:00Z'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => corporationStarbasesApi.getCorporationStarbases(12345));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((starbase: { starbase_id: number, type_id: number, system_id: number, moon_id: number, state: string, unanchor_at: string }) => {
            expect(starbase).toHaveProperty('starbase_id');
            expect(typeof starbase.starbase_id).toBe('number');
            expect(starbase).toHaveProperty('type_id');
            expect(typeof starbase.type_id).toBe('number');
            expect(starbase).toHaveProperty('system_id');
            expect(typeof starbase.system_id).toBe('number');
            expect(starbase).toHaveProperty('moon_id');
            expect(typeof starbase.moon_id).toBe('number');
            expect(starbase).toHaveProperty('state');
            expect(typeof starbase.state).toBe('string');
            expect(starbase).toHaveProperty('unanchor_at');
            expect(typeof starbase.unanchor_at).toBe('string');
        });
    });
});
