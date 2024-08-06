import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetPublicContractBidsApi {
    constructor(private client: ApiClient) {}

    async getPublicContractBids(contractId: number): Promise<any> {
        return handleRequest(this.client, `contracts/public/bids/${contractId}`, 'GET', undefined, false);
    }
}
