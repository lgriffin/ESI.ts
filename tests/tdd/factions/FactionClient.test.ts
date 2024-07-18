import { FactionClient } from '../../../src/clients/FactionClient';
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

const factionClient = new FactionClient(client);

describe('FactionClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getLeaderboardsCharacters', async () => {
        const mockResponse = {
            kills: {
                yesterday: [{ character_id: 1, amount: 100 }],
                last_week: [{ character_id: 1, amount: 500 }],
                total: [{ character_id: 1, amount: 1000 }]
            },
            victory_points: {
                yesterday: [{ character_id: 1, amount: 10 }],
                last_week: [{ character_id: 1, amount: 50 }],
                total: [{ character_id: 1, amount: 100 }]
            }
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await factionClient.getLeaderboardsCharacters();

        expect(result).toHaveProperty('kills');
        expect(result.kills).toHaveProperty('yesterday');
        expect(result.kills).toHaveProperty('last_week');
        expect(result.kills).toHaveProperty('total');
        expect(result).toHaveProperty('victory_points');
        expect(result.victory_points).toHaveProperty('yesterday');
        expect(result.victory_points).toHaveProperty('last_week');
        expect(result.victory_points).toHaveProperty('total');
    });

    it('should return valid structure for getLeaderboardsCorporations', async () => {
        const mockResponse = {
            kills: {
                yesterday: [{ corporation_id: 1, amount: 100 }],
                last_week: [{ corporation_id: 1, amount: 500 }],
                total: [{ corporation_id: 1, amount: 1000 }]
            },
            victory_points: {
                yesterday: [{ corporation_id: 1, amount: 10 }],
                last_week: [{ corporation_id: 1, amount: 50 }],
                total: [{ corporation_id: 1, amount: 100 }]
            }
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await factionClient.getLeaderboardsCorporations();

        expect(result).toHaveProperty('kills');
        expect(result.kills).toHaveProperty('yesterday');
        expect(result.kills).toHaveProperty('last_week');
        expect(result.kills).toHaveProperty('total');
        expect(result).toHaveProperty('victory_points');
        expect(result.victory_points).toHaveProperty('yesterday');
        expect(result.victory_points).toHaveProperty('last_week');
        expect(result.victory_points).toHaveProperty('total');
    });

    it('should return valid structure for getLeaderboardsOverall', async () => {
        const mockResponse = {
            kills: {
                yesterday: [{ faction_id: 1, amount: 100 }],
                last_week: [{ faction_id: 1, amount: 500 }],
                total: [{ faction_id: 1, amount: 1000 }]
            },
            victory_points: {
                yesterday: [{ faction_id: 1, amount: 10 }],
                last_week: [{ faction_id: 1, amount: 50 }],
                total: [{ faction_id: 1, amount: 100 }]
            }
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await factionClient.getLeaderboardsOverall();

        expect(result).toHaveProperty('kills');
        expect(result.kills).toHaveProperty('yesterday');
        expect(result.kills).toHaveProperty('last_week');
        expect(result.kills).toHaveProperty('total');
        expect(result).toHaveProperty('victory_points');
        expect(result.victory_points).toHaveProperty('yesterday');
        expect(result.victory_points).toHaveProperty('last_week');
        expect(result.victory_points).toHaveProperty('total');
    });

    it('should return valid structure for getStats', async () => {
        const mockResponse = [
            {
                faction_id: 500001,
                kills: {
                    last_week: 200,
                    total: 5000,
                    yesterday: 50
                },
                pilots: 300,
                victory_points: {
                    last_week: 1500,
                    total: 30000,
                    yesterday: 75
                }
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await factionClient.getStats();

        expect(Array.isArray(result)).toBe(true);
        result.forEach((stat: { faction_id: number, kills: { last_week: number, total: number, yesterday: number }, pilots: number, victory_points: { last_week: number, total: number, yesterday: number } }) => {
            expect(stat).toHaveProperty('faction_id');
            expect(typeof stat.faction_id).toBe('number');
            expect(stat).toHaveProperty('kills');
            expect(stat.kills).toHaveProperty('last_week');
            expect(typeof stat.kills.last_week).toBe('number');
            expect(stat.kills).toHaveProperty('total');
            expect(typeof stat.kills.total).toBe('number');
            expect(stat.kills).toHaveProperty('yesterday');
            expect(typeof stat.kills.yesterday).toBe('number');
            expect(stat).toHaveProperty('pilots');
            expect(typeof stat.pilots).toBe('number');
            expect(stat).toHaveProperty('victory_points');
            expect(stat.victory_points).toHaveProperty('last_week');
            expect(typeof stat.victory_points.last_week).toBe('number');
            expect(stat.victory_points).toHaveProperty('total');
            expect(typeof stat.victory_points.total).toBe('number');
            expect(stat.victory_points).toHaveProperty('yesterday');
            expect(typeof stat.victory_points.yesterday).toBe('number');
        });
        
    });

    it('should return valid structure for getCharacterStats', async () => {
        const mockResponse = {
            faction_id: 500001,
            kills: {
                last_week: 200,
                total: 5000,
                yesterday: 50
            },
            victory_points: {
                last_week: 1500,
                total: 30000,
                yesterday: 75
            }
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await factionClient.getCharacterStats(123456789);

        expect(result).toHaveProperty('faction_id');
        expect(typeof result.faction_id).toBe('number');
        expect(result).toHaveProperty('kills');
        expect(result.kills).toHaveProperty('last_week');
        expect(typeof result.kills.last_week).toBe('number');
        expect(result.kills).toHaveProperty('total');
        expect(typeof result.kills.total).toBe('number');
        expect(result.kills).toHaveProperty('yesterday');
        expect(typeof result.kills.yesterday).toBe('number');
        expect(result).toHaveProperty('victory_points');
        expect(result.victory_points).toHaveProperty('last_week');
        expect(typeof result.victory_points.last_week).toBe('number');
        expect(result.victory_points).toHaveProperty('total');
        expect(typeof result.victory_points.total).toBe('number');
        expect(result.victory_points).toHaveProperty('yesterday');
        expect(typeof result.victory_points.yesterday).toBe('number');
    });

    it('should return valid structure for getCorporationStats', async () => {
        const mockResponse = {
            faction_id: 500001,
            kills: {
                last_week: 200,
                total: 5000,
                yesterday: 50
            },
            victory_points: {
                last_week: 1500,
                total: 30000,
                yesterday: 75
            }
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await factionClient.getCorporationStats(987654321);

        expect(result).toHaveProperty('faction_id');
        expect(typeof result.faction_id).toBe('number');
        expect(result).toHaveProperty('kills');
        expect(result.kills).toHaveProperty('last_week');
        expect(typeof result.kills.last_week).toBe('number');
        expect(result.kills).toHaveProperty('total');
        expect(typeof result.kills.total).toBe('number');
        expect(result.kills).toHaveProperty('yesterday');
        expect(typeof result.kills.yesterday).toBe('number');
        expect(result).toHaveProperty('victory_points');
        expect(result.victory_points).toHaveProperty('last_week');
        expect(typeof result.victory_points.last_week).toBe('number');
        expect(result.victory_points).toHaveProperty('total');
        expect(typeof result.victory_points.total).toBe('number');
        expect(result.victory_points).toHaveProperty('yesterday');
        expect(typeof result.victory_points.yesterday).toBe('number');
    });

    it('should return valid structure for getSystems', async () => {
        const mockResponse = [
            {
                contested: "uncontested",
                occupier_faction_id: 500001,
                owner_faction_id: 500002,
                solar_system_id: 30002078,
                victory_points: 20,
                victory_points_threshold: 3000
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await factionClient.getSystems();

        expect(Array.isArray(result)).toBe(true);
        result.forEach((system: { contested: string, occupier_faction_id: number, owner_faction_id: number, solar_system_id: number, victory_points: number, victory_points_threshold: number }) => {
            expect(system).toHaveProperty('contested');
            expect(typeof system.contested).toBe('string');
            expect(system).toHaveProperty('occupier_faction_id');
            expect(typeof system.occupier_faction_id).toBe('number');
            expect(system).toHaveProperty('owner_faction_id');
            expect(typeof system.owner_faction_id).toBe('number');
            expect(system).toHaveProperty('solar_system_id');
            expect(typeof system.solar_system_id).toBe('number');
            expect(system).toHaveProperty('victory_points');
            expect(typeof system.victory_points).toBe('number');
            expect(system).toHaveProperty('victory_points_threshold');
            expect(typeof system.victory_points_threshold).toBe('number');
        });
        
    });

    it('should return valid structure for getWars', async () => {
        const mockResponse = [
            {
                against_id: 500002,
                faction_id: 500001
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await factionClient.getWars();

        expect(Array.isArray(result)).toBe(true);
        result.forEach((war: { against_id: number, faction_id: number }) => {
            expect(war).toHaveProperty('against_id');
            expect(typeof war.against_id).toBe('number');
            expect(war).toHaveProperty('faction_id');
            expect(typeof war.faction_id).toBe('number');
        });
        
    });
});
