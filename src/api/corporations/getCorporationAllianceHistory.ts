import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationAllianceHistoryApi {
    constructor(private client: ApiClient) {}

    async getCorporationAllianceHistory(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/alliancehistory`, 'GET', undefined, false);
    }
}
