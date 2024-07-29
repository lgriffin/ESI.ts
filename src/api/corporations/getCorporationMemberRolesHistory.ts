import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationMemberRolesHistoryApi {
    constructor(private client: ApiClient) {}

    async getCorporationMemberRolesHistory(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/roles/history`, 'GET', undefined, true);
    }
}
