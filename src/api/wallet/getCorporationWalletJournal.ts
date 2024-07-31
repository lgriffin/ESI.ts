// src/api/wallet/getCorporationWalletJournal.ts
import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationWalletJournalApi {
    constructor(private client: ApiClient) {}

    async getCorporationWalletJournal(corporationId: number, division: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/wallets/${division}/journal`, 'GET', undefined, true);
    }
}
