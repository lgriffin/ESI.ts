import { UniverseRacesApi } from '../../../src/api/universe/getRaces';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseRacesApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeRacesApi = new UniverseRacesApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getRaces', async () => {
        const mockResponse = [
            {
                race_id: 1,
                name: 'Race 1',
                description: 'Description 1'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type RaceResponse = {
            race_id: number;
            name: string;
            description: string;
        };

        const result = await universeRacesApi.getRaces() as RaceResponse[];

        expect(Array.isArray(result)).toBe(true);
        result.forEach((race: RaceResponse) => {
            expect(race).toHaveProperty('race_id');
            expect(typeof race.race_id).toBe('number');
            expect(race).toHaveProperty('name');
            expect(typeof race.name).toBe('string');
            expect(race).toHaveProperty('description');
            expect(typeof race.description).toBe('string');
        });
    });
});
