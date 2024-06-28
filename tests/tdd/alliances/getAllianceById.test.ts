import { AllianceByIdApi } from '../../../src/api/alliances/getAllianceById';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

interface AllianceInfo {
    alliance_id: number;
    name: string;
    ticker: string;
    date_founded?: string;
    executor_corp_id?: number;
    faction_id?: number;
}

let allianceByIdApi: AllianceByIdApi;

beforeAll(() => {
    allianceByIdApi = new AllianceByIdApi(getClient());
});

describe('AllianceByIdApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for alliance information', async () => {
        const mockResponse: AllianceInfo = {
            alliance_id: 99000006,
            name: "Test Alliance",
            ticker: "TEST",
            date_founded: "2022-01-01T00:00:00Z"
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await allianceByIdApi.getAllianceById(99000006) as AllianceInfo;

        expect(result).toHaveProperty('alliance_id');
        expect(typeof result.alliance_id).toBe('number');
        
        expect(result).toHaveProperty('name');
        expect(typeof result.name).toBe('string');
        
        expect(result).toHaveProperty('ticker');
        expect(typeof result.ticker).toBe('string');
        
        if (result.date_founded) {
            expect(typeof result.date_founded).toBe('string');
        }
        
        if (result.executor_corp_id) {
            expect(typeof result.executor_corp_id).toBe('number');
        }
        
        if (result.faction_id) {
            expect(typeof result.faction_id).toBe('number');
        }
    });
});
