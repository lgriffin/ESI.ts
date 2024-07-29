import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterContractsApi {
    constructor(private client: ApiClient) {}

    async getCharacterContracts(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/contracts`, 'GET', undefined, true);
    }
}
