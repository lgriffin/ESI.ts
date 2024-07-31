// src/api/wallet/getCorporationWalletTransactions.ts
import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationWalletTransactionsApi {
    constructor(private client: ApiClient) {}

    async getCorporationWalletTransactions(corporationId: number, division: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/wallets/${division}/transactions`, 'GET', undefined, true);
    }
}
