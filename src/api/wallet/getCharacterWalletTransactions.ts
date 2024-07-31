// src/api/wallet/getCharacterWalletTransactions.ts
import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterWalletTransactionsApi {
    constructor(private client: ApiClient) {}

    async getCharacterWalletTransactions(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/wallet/transactions`, 'GET', undefined, true);
    }
}
