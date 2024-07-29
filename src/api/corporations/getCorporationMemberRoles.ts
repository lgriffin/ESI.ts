import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationMemberRolesApi {
    constructor(private client: ApiClient) {}

    async getCorporationMemberRoles(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/roles`, 'GET', undefined, true);
    }
}
