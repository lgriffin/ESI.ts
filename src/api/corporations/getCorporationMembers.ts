import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationMembersApi {
    constructor(private client: ApiClient) {}

    async getCorporationMembers(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/members`);
    }
}
