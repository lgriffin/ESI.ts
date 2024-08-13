import { SovereigntyStructuresApi } from '../../../src/api/sovereignty/getSovereigntyStructures';
import { ApiClient } from '../../../src/core/ApiClient';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('SovereigntyStructuresApi', () => {
    let client: ApiClient;
    let sovereigntyStructuresApi: SovereigntyStructuresApi;

    beforeEach(() => {
        fetchMock.resetMocks();
        client = new ApiClient('dummy-client-id', 'https://esi.evetech.net');
        sovereigntyStructuresApi = new SovereigntyStructuresApi(client);
    });

    it('should return valid structure for sovereignty structures', async () => {
        const mockResponse = [
            {
                alliance_id: 99000006,
                corporation_id: 98000002,
                faction_id: 500001,
                system_id: 30000142,
                structure_id: 1018253388776,
                type_id: 32226,
                vulnerable_end_time: '2023-07-02T00:00:00Z',
                vulnerable_start_time: '2023-07-01T17:00:00Z'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => sovereigntyStructuresApi.getSovereigntyStructures());

        expect(Array.isArray(result)).toBe(true);
        result.forEach((structure: any) => {
            expect(structure).toHaveProperty('structure_id');
            expect(typeof structure.structure_id).toBe('number');
        });
    });
});
