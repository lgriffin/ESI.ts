import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetPublicContractItemsApi {
    constructor(private client: ApiClient) {}

    async getPublicContractItems(contractId: number): Promise<any> {
        return handleRequest(this.client, `contracts/public/items/${contractId}`, 'GET', undefined, false);
    }
}
