import { ApiClient } from '../../../src/core/ApiClient';
import { SovereigntyClient } from '../../../src/clients/SovereigntyClient';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('SovereigntyClient', () => {
    let client: ApiClient;
    let sovereigntyClient: SovereigntyClient;

    beforeEach(() => {
        fetchMock.resetMocks();
        client = new ApiClient('dummy-client-id', 'https://esi.evetech.net');
        sovereigntyClient = new SovereigntyClient(client);
    });

    it('should get sovereignty campaigns', async () => {
        const mockResponse = [
            {
                attacker_score: 0.6,
                campaign_id: 1,
                constellation_id: 20000125,
                defender_id: 2000001,
                defender_score: 0.4,
                event_type: 'tcu_defense',
                solar_system_id: 30000142,
                start_time: '2023-07-01T17:00:00Z'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => sovereigntyClient.getSovereigntyCampaigns());
        expect(Array.isArray(result)).toBe(true);
        result.forEach((campaign: any) => {
            expect(campaign).toHaveProperty('campaign_id');
            expect(typeof campaign.campaign_id).toBe('number');
        });
    });

    it('should get sovereignty map', async () => {
        const mockResponse = [
            {
                alliance_id: 99000006,
                corporation_id: 98000002,
                faction_id: 500001,
                system_id: 30000142
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => sovereigntyClient.getSovereigntyMap());
        expect(Array.isArray(result)).toBe(true);
        result.forEach((map: any) => {
            expect(map).toHaveProperty('system_id');
            expect(typeof map.system_id).toBe('number');
        });
    });

    it('should get sovereignty structures', async () => {
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

        const result = await getBody(() => sovereigntyClient.getSovereigntyStructures());
        expect(Array.isArray(result)).toBe(true);
        result.forEach((structure: any) => {
            expect(structure).toHaveProperty('structure_id');
            expect(typeof structure.structure_id).toBe('number');
        });
    });
});
