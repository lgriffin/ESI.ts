import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { sovereigntyEndpoints } from '../core/endpoints/sovereigntyEndpoints';
import { SovereigntyCampaign, SovereigntyMap, SovereigntyStructure } from '../types/api-responses';

export class SovereigntyClient {
    private api: ReturnType<typeof createClient<typeof sovereigntyEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, sovereigntyEndpoints);
    }

    async getSovereigntyCampaigns(): Promise<SovereigntyCampaign[]> {
        return this.api.getSovereigntyCampaigns();
    }

    async getSovereigntyMap(): Promise<SovereigntyMap[]> {
        return this.api.getSovereigntyMap();
    }

    async getSovereigntyStructures(): Promise<SovereigntyStructure[]> {
        return this.api.getSovereigntyStructures();
    }
}
