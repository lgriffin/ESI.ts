import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationStarbasesApi {
    constructor(private client: ApiClient) {}

    async getCorporationStarbases(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/starbases`);
    }
}
