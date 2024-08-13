import { AllianceCorporationsApi } from '../../../src/api/alliances/getAllianceCorporations';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';


fetchMock.enableMocks();

interface Corporation {
    corporation_id: number;
}

let allianceCorporationsApi: AllianceCorporationsApi;

beforeAll(() => {
    allianceCorporationsApi = new AllianceCorporationsApi(getClient());
});

describe('AllianceCorporationsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for alliance corporations', async () => {
        const mockResponse: Corporation[] = [
            { corporation_id: 98000001 },
            { corporation_id: 98000002 }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => allianceCorporationsApi.getAllianceCorporations(99000006)) as Corporation[];

        expect(Array.isArray(result)).toBe(true);
        result.forEach((corporation: Corporation) => {
            expect(corporation).toHaveProperty('corporation_id');
            expect(typeof corporation.corporation_id).toBe('number');
        });
    });
});
