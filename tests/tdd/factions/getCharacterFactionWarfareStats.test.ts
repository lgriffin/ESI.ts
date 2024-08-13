import { GetCharacterFactionWarfareStatsApi } from '../../../src/api/factions/getCharacterFactionWarfareStats';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

let getCharacterFactionWarfareStatsApi: GetCharacterFactionWarfareStatsApi;

beforeAll(() => {
    getCharacterFactionWarfareStatsApi = new GetCharacterFactionWarfareStatsApi(getClient());
});

describe('GetCharacterFactionWarfareStatsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for character faction warfare stats', async () => {
        const mockResponse = {
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
        };

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

        const result = await getBody(() => getCharacterFactionWarfareStatsApi.getCharacterStats(123456)) as FactionWarfareStat;

        expect(result).toHaveProperty('faction_id');
        expect(typeof result.faction_id).toBe('number');
        expect(result).toHaveProperty('kills');
        expect(result.kills).toHaveProperty('last_week');
        expect(typeof result.kills.last_week).toBe('number');
        expect(result.kills).toHaveProperty('total');
        expect(typeof result.kills.total).toBe('number');
        expect(result.kills).toHaveProperty('yesterday');
        expect(typeof result.kills.yesterday).toBe('number');
        expect(result).toHaveProperty('pilots');
        expect(typeof result.pilots).toBe('number');
        expect(result).toHaveProperty('victory_points');
        expect(result.victory_points).toHaveProperty('last_week');
        expect(typeof result.victory_points.last_week).toBe('number');
        expect(result.victory_points).toHaveProperty('total');
        expect(typeof result.victory_points.total).toBe('number');
        expect(result.victory_points).toHaveProperty('yesterday');
        expect(typeof result.victory_points.yesterday).toBe('number');
    });
});
