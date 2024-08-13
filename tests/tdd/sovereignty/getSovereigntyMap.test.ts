import { SovereigntyMapApi } from '../../../src/api/sovereignty/getSovereigntyMap';
import { ApiClient } from '../../../src/core/ApiClient';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('SovereigntyMapApi', () => {
    let client: ApiClient;
    let sovereigntyMapApi: SovereigntyMapApi;

    beforeEach(() => {
        fetchMock.resetMocks();
        client = new ApiClient('dummy-client-id', 'https://esi.evetech.net');
        sovereigntyMapApi = new SovereigntyMapApi(client);
    });

    it('should return valid structure for sovereignty map', async () => {
        const mockResponse = [
            {
                alliance_id: 99000006,
                corporation_id: 98000002,
                faction_id: 500001,
                system_id: 30000142
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => sovereigntyMapApi.getSovereigntyMap());

        expect(Array.isArray(result)).toBe(true);
        result.forEach((map: any) => {
            expect(map).toHaveProperty('system_id');
            expect(typeof map.system_id).toBe('number');
        });
    });
});
