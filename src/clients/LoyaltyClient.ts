import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { loyaltyEndpoints } from '../core/endpoints/loyaltyEndpoints';
import { LoyaltyPoints, LoyaltyStoreOffer } from '../types/api-responses';

export class LoyaltyClient {
    private api: ReturnType<typeof createClient<typeof loyaltyEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, loyaltyEndpoints);
    }

    async getLoyaltyPoints(characterId: number): Promise<LoyaltyPoints[]> {
        return this.api.getLoyaltyPoints(characterId);
    }

    async getLoyaltyStoreOffers(corporationId: number): Promise<LoyaltyStoreOffer[]> {
        return this.api.getLoyaltyStoreOffers(corporationId);
    }
}
