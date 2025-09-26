import { IncursionsClient } from '../../../src/clients/IncursionsClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { getBody } from '../../../src/core/util/testHelpers';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('IncursionsClient', () => {
    let incursionsClient: IncursionsClient;

    beforeEach(() => {
        fetchMock.resetMocks();
        
        const config = getConfig();
        const client = new ApiClientBuilder()
            .setClientId(config.projectName)
            .setLink(config.link)
            .setAccessToken(config.authToken || undefined)
            .build();

        incursionsClient = new IncursionsClient(client);
    });

    describe('getIncursions', () => {
        it('should return valid incursion data structure', async () => {
            const mockResponse = [
                {
                    constellation_id: 20000169,
                    faction_id: 500019,
                    has_boss: true,
                    infested_solar_systems: [30001161, 30001162],
                    influence: 0.9,
                    staging_solar_system_id: 30001161,
                    state: 'mobilizing',
                    type: 'Incursion'
                },
                {
                    constellation_id: 20000170,
                    faction_id: 500019,
                    has_boss: false,
                    infested_solar_systems: [30001163, 30001164, 30001165],
                    influence: 0.7,
                    staging_solar_system_id: 30001163,
                    state: 'established',
                    type: 'Incursion'
                }
            ];

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await getBody(() => incursionsClient.getIncursions());

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);

            // Validate first incursion structure
            const firstIncursion = result[0];
            expect(firstIncursion).toHaveProperty('constellation_id');
            expect(typeof firstIncursion.constellation_id).toBe('number');
            expect(firstIncursion.constellation_id).toBe(20000169);

            expect(firstIncursion).toHaveProperty('faction_id');
            expect(typeof firstIncursion.faction_id).toBe('number');
            expect(firstIncursion.faction_id).toBe(500019);

            expect(firstIncursion).toHaveProperty('has_boss');
            expect(typeof firstIncursion.has_boss).toBe('boolean');
            expect(firstIncursion.has_boss).toBe(true);

            expect(firstIncursion).toHaveProperty('infested_solar_systems');
            expect(Array.isArray(firstIncursion.infested_solar_systems)).toBe(true);
            expect(firstIncursion.infested_solar_systems).toEqual([30001161, 30001162]);

            expect(firstIncursion).toHaveProperty('influence');
            expect(typeof firstIncursion.influence).toBe('number');
            expect(firstIncursion.influence).toBe(0.9);

            expect(firstIncursion).toHaveProperty('staging_solar_system_id');
            expect(typeof firstIncursion.staging_solar_system_id).toBe('number');
            expect(firstIncursion.staging_solar_system_id).toBe(30001161);

            expect(firstIncursion).toHaveProperty('state');
            expect(typeof firstIncursion.state).toBe('string');
            expect(firstIncursion.state).toBe('mobilizing');

            expect(firstIncursion).toHaveProperty('type');
            expect(typeof firstIncursion.type).toBe('string');
            expect(firstIncursion.type).toBe('Incursion');

            // Validate all incursions have required properties
            result.forEach((incursion: any) => {
                expect(incursion).toHaveProperty('constellation_id');
                expect(incursion).toHaveProperty('faction_id');
                expect(incursion).toHaveProperty('has_boss');
                expect(incursion).toHaveProperty('infested_solar_systems');
                expect(incursion).toHaveProperty('influence');
                expect(incursion).toHaveProperty('staging_solar_system_id');
                expect(incursion).toHaveProperty('state');
                expect(incursion).toHaveProperty('type');

                // Type validations
                expect(typeof incursion.constellation_id).toBe('number');
                expect(typeof incursion.faction_id).toBe('number');
                expect(typeof incursion.has_boss).toBe('boolean');
                expect(Array.isArray(incursion.infested_solar_systems)).toBe(true);
                expect(typeof incursion.influence).toBe('number');
                expect(typeof incursion.staging_solar_system_id).toBe('number');
                expect(typeof incursion.state).toBe('string');
                expect(typeof incursion.type).toBe('string');

                // Value validations
                expect(incursion.constellation_id).toBeGreaterThan(0);
                expect(incursion.faction_id).toBeGreaterThan(0);
                expect(incursion.influence).toBeGreaterThanOrEqual(0);
                expect(incursion.influence).toBeLessThanOrEqual(1);
                expect(incursion.staging_solar_system_id).toBeGreaterThan(0);
                expect(incursion.infested_solar_systems.length).toBeGreaterThan(0);
                expect(['mobilizing', 'established', 'withdrawing'].includes(incursion.state)).toBe(true);
                expect(incursion.type).toBe('Incursion');
            });
        });

        it('should handle empty incursion list', async () => {
            const mockResponse: any[] = [];

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await getBody(() => incursionsClient.getIncursions());

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });

        it('should handle single incursion response', async () => {
            const mockResponse = [
                {
                    constellation_id: 20000169,
                    faction_id: 500019,
                    has_boss: false,
                    infested_solar_systems: [30001161],
                    influence: 0.5,
                    staging_solar_system_id: 30001161,
                    state: 'established',
                    type: 'Incursion'
                }
            ];

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await getBody(() => incursionsClient.getIncursions());

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0].constellation_id).toBe(20000169);
        });

        it('should handle API errors gracefully', async () => {
            fetchMock.mockResponseOnce('Server Error', { status: 500 });

            const result = await getBody(() => incursionsClient.getIncursions());
            expect(result).toHaveProperty('error');
            expect(result.error).toBe('internal server error');
        });
    });
});
