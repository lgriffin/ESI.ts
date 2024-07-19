import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationMemberLimitApi {
    constructor(private client: ApiClient) {}

    async getCorporationMemberLimit(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/members/limit`);
    }
}
