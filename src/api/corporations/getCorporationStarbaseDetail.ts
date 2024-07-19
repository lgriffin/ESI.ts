import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationStarbaseDetailApi {
    constructor(private client: ApiClient) {}

    async getCorporationStarbaseDetail(corporationId: number, starbaseId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/starbases/${starbaseId}`);
    }
}
