import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationFactionWarfareStatsApi {
    constructor(private client: ApiClient) {}

    async getCorporationStats(corporationId: number): Promise<object> {
        return await handleRequest(this.client, `corporations/${corporationId}/fw/stats`, 'GET', undefined, true);
    }
}
