// src/api/wallet/getCharacterWalletJournal.ts
import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterWalletJournalApi {
    constructor(private client: ApiClient) {}

    async getCharacterWalletJournal(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/wallet/journal`, 'GET', undefined, true);
    }
}
