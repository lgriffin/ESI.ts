import { IncursionsClient } from '../../../src/clients/IncursionsClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const config = getConfig();

const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined) // Allow undefined token
    .build();

const incursionsClient = new IncursionsClient(client);

describe('IncursionsClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid incursions information from client', async () => {
        const mockResponse = [
            {
                constellation_id: 20000030,
                faction_id: 500019,
                has_boss: true,
                infested_solar_systems: [30000474, 30000475, 30000476],
                influence: 1,
                staging_solar_system_id: 30000474,
                state: 'withdrawing',
                type: 'Incursion',
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await incursionsClient.getIncursions();

        expect(Array.isArray(result)).toBe(true);
        if (Array.isArray(result)) {
            result.forEach((incursion: any) => {
                expect(incursion).toHaveProperty('constellation_id');
                expect(typeof incursion.constellation_id).toBe('number');
                expect(incursion).toHaveProperty('faction_id');
                expect(typeof incursion.faction_id).toBe('number');
                expect(incursion).toHaveProperty('has_boss');
                expect(typeof incursion.has_boss).toBe('boolean');
                expect(incursion).toHaveProperty('infested_solar_systems');
                expect(Array.isArray(incursion.infested_solar_systems)).toBe(true);
                expect(incursion).toHaveProperty('influence');
                expect(typeof incursion.influence).toBe('number');
                expect(incursion).toHaveProperty('staging_solar_system_id');
                expect(typeof incursion.staging_solar_system_id).toBe('number');
                expect(incursion).toHaveProperty('state');
                expect(typeof incursion.state).toBe('string');
                expect(incursion).toHaveProperty('type');
                expect(typeof incursion.type).toBe('string');
            });
        }
    });
});
