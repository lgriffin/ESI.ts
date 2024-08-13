import { GetCorporationStandingsApi } from '../../../src/api/corporations/getCorporationStandings';
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

const corporationStandingsApi = new GetCorporationStandingsApi(client);

describe('GetCorporationStandingsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation standings', async () => {
        const mockResponse = [
            {
                from_id: 12345,
                from_type: 'agent',
                standing: 0.5
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => corporationStandingsApi.getCorporationStandings(12345));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((standing: { from_id: number, from_type: string, standing: number }) => {
            expect(standing).toHaveProperty('from_id');
            expect(typeof standing.from_id).toBe('number');
            expect(standing).toHaveProperty('from_type');
            expect(typeof standing.from_type).toBe('string');
            expect(standing).toHaveProperty('standing');
            expect(typeof standing.standing).toBe('number');
        });
    });
});
