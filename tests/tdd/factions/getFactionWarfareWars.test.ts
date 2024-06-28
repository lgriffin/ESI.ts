import { FactionWarfareWarsApi } from '../../../src/api/factions/getFactionWarfareWars';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

let factionWarfareWarsApi: FactionWarfareWarsApi;

beforeAll(() => {
    factionWarfareWarsApi = new FactionWarfareWarsApi(getClient());
});

describe('FactionWarfareWarsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for faction warfare wars', async () => {
        const mockResponse = [
            {
                against_id: 500002,
                faction_id: 500001
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type FactionWarfareWar = {
            against_id: number;
            faction_id: number;
        };

        const result = await factionWarfareWarsApi.getWars() as FactionWarfareWar[];

        expect(Array.isArray(result)).toBe(true);
        result.forEach((war: FactionWarfareWar) => {
            expect(war).toHaveProperty('against_id');
            expect(typeof war.against_id).toBe('number');
            expect(war).toHaveProperty('faction_id');
            expect(typeof war.faction_id).toBe('number');
        });
    });
});
