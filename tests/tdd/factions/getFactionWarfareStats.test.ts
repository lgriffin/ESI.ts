import { FactionWarfareStatsApi } from '../../../src/api/factions/getFactionWarfareStats';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const config = getConfig();

const createClient = (authToken?: string) => {
    return new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(authToken) // Pass token if available
        .build();
};

describe('FactionWarfareStatsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for faction warfare stats without auth token', async () => {
        const client = createClient();
        const factionWarfareStatsApi = new FactionWarfareStatsApi(client);

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

        type FactionWarfareStat = {
            faction_id: number;
            kills: {
                last_week: number;
                total: number;
                yesterday: number;
            };
            pilots: number;
            victory_points: {
                last_week: number;
                total: number;
                yesterday: number;
            };
        };

        const result = await factionWarfareStatsApi.getStats() as FactionWarfareStat[];

        expect(Array.isArray(result)).toBe(true);
        result.forEach((stat: FactionWarfareStat) => {
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

    it('should return valid structure for faction warfare stats with auth token', async () => {
        const client = createClient(config.authToken);
        const factionWarfareStatsApi = new FactionWarfareStatsApi(client);

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

        type FactionWarfareStat = {
            faction_id: number;
            kills: {
                last_week: number;
                total: number;
                yesterday: number;
            };
            pilots: number;
            victory_points: {
                last_week: number;
                total: number;
                yesterday: number;
            };
        };

        const result = await factionWarfareStatsApi.getStats() as FactionWarfareStat[];

        expect(Array.isArray(result)).toBe(true);
        result.forEach((stat: FactionWarfareStat) => {
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
});
