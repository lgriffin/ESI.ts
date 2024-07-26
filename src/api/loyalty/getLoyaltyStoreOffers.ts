import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetLoyaltyStoreOffersApi {
    constructor(private client: ApiClient) {}

    async getLoyaltyStoreOffers(corporationId: number): Promise<any> {
        return handleRequest(this.client, `loyalty/stores/${corporationId}/offers`);
    }
}
