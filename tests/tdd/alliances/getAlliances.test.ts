import {AllAlliancesApi} from '../../../src/api/alliances/getAlliances';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

interface Alliance {
    alliance_id: number;
}

let alliancesApi: AllAlliancesApi;

beforeAll(() => {
    alliancesApi = new AllAlliancesApi(getClient());
});

describe('AlliancesApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for all alliances', async () => {
        const mockResponse: Alliance[] = [
            { alliance_id: 99000001 },
            { alliance_id: 99000002 }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await alliancesApi.getAllAlliances() as Alliance[];

        expect(Array.isArray(result)).toBe(true);
        result.forEach((alliance: Alliance) => {
            expect(alliance).toHaveProperty('alliance_id');
            expect(typeof alliance.alliance_id).toBe('number');
        });
    });
});
