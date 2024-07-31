// src/api/wallet/getCharacterWallet.ts
import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterWalletApi {
    constructor(private client: ApiClient) {}

    async getCharacterWallet(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/wallet`, 'GET', undefined, true);
    }
}
