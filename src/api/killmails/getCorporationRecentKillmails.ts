import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationRecentKillmailsApi {
    constructor(private client: ApiClient) {}

    async getCorporationRecentKillmails(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/killmails/recent`);
    }
}
