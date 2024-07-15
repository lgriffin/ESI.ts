import { SovereigntyCampaignsApi } from '../../../src/api/sovereignty/getSovereigntyCampaigns';
import { ApiClient } from '../../../src/core/ApiClient';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('SovereigntyCampaignsApi', () => {
    let client: ApiClient;
    let sovereigntyCampaignsApi: SovereigntyCampaignsApi;

    beforeEach(() => {
        fetchMock.resetMocks();
        client = new ApiClient('dummy-client-id', 'https://esi.evetech.net');
        sovereigntyCampaignsApi = new SovereigntyCampaignsApi(client);
    });

    it('should return valid structure for sovereignty campaigns', async () => {
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

        const result = await sovereigntyCampaignsApi.getSovereigntyCampaigns();

        expect(Array.isArray(result)).toBe(true);
        result.forEach((campaign: any) => {
            expect(campaign).toHaveProperty('campaign_id');
            expect(typeof campaign.campaign_id).toBe('number');
        });
    });
});
