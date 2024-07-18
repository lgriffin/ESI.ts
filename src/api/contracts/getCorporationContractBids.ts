import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationContractBidsApi {
    constructor(private client: ApiClient) {}

    async getCorporationContractBids(corporationId: number, contractId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/contracts/${contractId}/bids`);
    }
}
