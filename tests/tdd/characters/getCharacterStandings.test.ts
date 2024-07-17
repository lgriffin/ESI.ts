import { GetCharacterStandingsApi } from '../../../src/api/characters/getCharacterStandings';
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

const characterStandingsApi = new GetCharacterStandingsApi(client);

describe('GetCharacterStandingsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for character standings', async () => {
        const mockResponse = {
            standings: [
                {
                    from_id: 123,
                    from_type: 'agent',
                    standing: 5.0
                }
            ]
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await characterStandingsApi.getCharacterStandings(123456);

        expect(result).toHaveProperty('standings');
        expect(Array.isArray(result.standings)).toBe(true);
        result.standings.forEach((standing: { from_id: number, from_type: string, standing: number }) => {
            expect(standing).toHaveProperty('from_id');
            expect(standing).toHaveProperty('from_type');
            expect(standing).toHaveProperty('standing');
        });
    });
});
