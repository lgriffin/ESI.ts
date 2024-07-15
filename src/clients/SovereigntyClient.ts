import { ApiClient } from '../core/ApiClient';
import { SovereigntyCampaignsApi } from '../api/sovereignty/GetSovereigntyCampaigns';
import { SovereigntyMapApi } from '../api/sovereignty/GetSovereigntyMap';
import { SovereigntyStructuresApi } from '../api/sovereignty/GetSovereigntyStructures';

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
