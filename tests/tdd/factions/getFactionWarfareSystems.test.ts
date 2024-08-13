import { FactionWarfareSystemsApi } from '../../../src/api/factions/getFactionWarfareSystems';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

let factionWarfareSystemsApi: FactionWarfareSystemsApi;

beforeAll(() => {
    factionWarfareSystemsApi = new FactionWarfareSystemsApi(getClient());
});

describe('FactionWarfareSystemsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for faction warfare systems', async () => {
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

        type FactionWarfareSystem = {
            contested: string;
            occupier_faction_id: number;
            owner_faction_id: number;
            solar_system_id: number;
            victory_points: number;
            victory_points_threshold: number;
        };

        const result = await getBody(() => factionWarfareSystemsApi.getSystems()) as FactionWarfareSystem[];

        expect(Array.isArray(result)).toBe(true);
        result.forEach((system: FactionWarfareSystem) => {
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
});
