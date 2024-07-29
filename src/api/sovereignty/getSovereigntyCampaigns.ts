import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class SovereigntyCampaignsApi {
    constructor(private client: ApiClient) {}

    async getSovereigntyCampaigns(): Promise<any> {
        return handleRequest(this.client, 'sovereignty/campaigns', 'GET', undefined, false);
    }
}
