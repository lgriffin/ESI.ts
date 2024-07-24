import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterMiningLedgerApi {
    constructor(private client: ApiClient) {}

    async getCharacterMiningLedger(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/mining`);
    }
}
