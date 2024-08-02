import { getFactionWarfareStats } from '../../../src/api/factions/getFactionWarfareStats';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

let getFactionWarfareStatsApi: getFactionWarfareStats;

beforeAll(() => {
    getFactionWarfareStatsApi = new getFactionWarfareStats(getClient());
});

describe('GetFactionWarfareStatsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for faction warfare stats', async () => {
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

        const result = await getFactionWarfareStatsApi.getStats() as FactionWarfareStat[];

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
