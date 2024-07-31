// src/api/wallet/getCorporationWallets.ts
import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationWalletsApi {
    constructor(private client: ApiClient) {}

    async getCorporationWallets(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/wallets`, 'GET', undefined, true);
    }
}
