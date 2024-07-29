import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterContractBidsApi {
    constructor(private client: ApiClient) {}

    async getCharacterContractBids(characterId: number, contractId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/contracts/${contractId}/bids`, 'GET', undefined, true);
    }
}
