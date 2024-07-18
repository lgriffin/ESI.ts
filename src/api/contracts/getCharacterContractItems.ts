import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterContractItemsApi {
    constructor(private client: ApiClient) {}

    async getCharacterContractItems(characterId: number, contractId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/contracts/${contractId}/items`);
    }
}
