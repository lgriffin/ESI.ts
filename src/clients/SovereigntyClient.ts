import { ApiClient } from '../core/ApiClient';
import { SovereigntyCampaignsApi } from '../api/sovereignty/getSovereigntyCampaigns';
import { SovereigntyMapApi } from '../api/sovereignty/getSovereigntyMap';
import { SovereigntyStructuresApi } from '../api/sovereignty/getSovereigntyStructures';

export class SovereigntyClient {
    private sovereigntyCampaignsApi: SovereigntyCampaignsApi;
    private sovereigntyMapApi: SovereigntyMapApi;
    private sovereigntyStructuresApi: SovereigntyStructuresApi;

    constructor(client: ApiClient) {
        this.sovereigntyCampaignsApi = new SovereigntyCampaignsApi(client);
        this.sovereigntyMapApi = new SovereigntyMapApi(client);
        this.sovereigntyStructuresApi = new SovereigntyStructuresApi(client);
    }

    async getSovereigntyCampaigns(): Promise<any> {
        return await this.sovereigntyCampaignsApi.getSovereigntyCampaigns();
    }

    async getSovereigntyMap(): Promise<any> {
        return await this.sovereigntyMapApi.getSovereigntyMap();
    }

    async getSovereigntyStructures(): Promise<any> {
        return await this.sovereigntyStructuresApi.getSovereigntyStructures();
    }
}
