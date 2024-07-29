import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationContractItemsApi {
    constructor(private client: ApiClient) {}

    async getCorporationContractItems(corporationId: number, contractId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/contracts/${contractId}/items`, 'GET', undefined, true);
    }
}
