import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationStructuresApi {
    constructor(private client: ApiClient) {}

    async getCorporationStructures(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/structures`);
    }
}
