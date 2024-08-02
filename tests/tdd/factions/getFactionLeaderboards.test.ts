import { GetFactionLeaderboardsApi } from '../../../src/api/factions/getFactionLeaderboards';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

let getFactionLeaderboardsApi: GetFactionLeaderboardsApi;

beforeAll(() => {
    getFactionLeaderboardsApi = new GetFactionLeaderboardsApi(getClient());
});

describe('GetFactionLeaderboardsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for faction leaderboards', async () => {
        const mockResponse = {
            active_total: [
                {
                    amount: 123,
                    faction_id: 456
                }
            ],
            kills: {
                yesterday: [
                    {
                        amount: 12,
                        faction_id: 789
                    }
                ],
                week: [
                    {
                        amount: 34,
                        faction_id: 101
                    }
                ],
                total: [
                    {
                        amount: 56,
                        faction_id: 112
                    }
                ]
            }
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type LeaderboardEntry = {
            amount: number;
            faction_id: number;
        };

        type Leaderboard = {
            active_total: LeaderboardEntry[];
            kills: {
                yesterday: LeaderboardEntry[];
                week: LeaderboardEntry[];
                total: LeaderboardEntry[];
            };
        };

        const result = await getFactionLeaderboardsApi.getOverall() as Leaderboard;

        expect(result).toHaveProperty('active_total');
        expect(Array.isArray(result.active_total)).toBe(true);
        result.active_total.forEach((entry: LeaderboardEntry) => {
            expect(entry).toHaveProperty('amount');
            expect(typeof entry.amount).toBe('number');
            expect(entry).toHaveProperty('faction_id');
            expect(typeof entry.faction_id).toBe('number');
        });

        expect(result).toHaveProperty('kills');
        expect(result.kills).toHaveProperty('yesterday');
        expect(Array.isArray(result.kills.yesterday)).toBe(true);
        result.kills.yesterday.forEach((entry: LeaderboardEntry) => {
            expect(entry).toHaveProperty('amount');
            expect(typeof entry.amount).toBe('number');
            expect(entry).toHaveProperty('faction_id');
            expect(typeof entry.faction_id).toBe('number');
        });

        expect(result.kills).toHaveProperty('week');
        expect(Array.isArray(result.kills.week)).toBe(true);
        result.kills.week.forEach((entry: LeaderboardEntry) => {
            expect(entry).toHaveProperty('amount');
            expect(typeof entry.amount).toBe('number');
            expect(entry).toHaveProperty('faction_id');
            expect(typeof entry.faction_id).toBe('number');
        });

        expect(result.kills).toHaveProperty('total');
        expect(Array.isArray(result.kills.total)).toBe(true);
        result.kills.total.forEach((entry: LeaderboardEntry) => {
            expect(entry).toHaveProperty('amount');
            expect(typeof entry.amount).toBe('number');
            expect(entry).toHaveProperty('faction_id');
            expect(typeof entry.faction_id).toBe('number');
        });
    });
});
