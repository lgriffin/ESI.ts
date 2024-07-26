import { ApiClient } from '../core/ApiClient';
import { GetLoyaltyPointsApi } from '../api/loyalty/getLoyaltyPoints';
import { GetLoyaltyStoreOffersApi } from '../api/loyalty/getLoyaltyStoreOffers';

export class LoyaltyClient {
    private getLoyaltyPointsApi: GetLoyaltyPointsApi;
    private getLoyaltyStoreOffersApi: GetLoyaltyStoreOffersApi;

    constructor(client: ApiClient) {
        this.getLoyaltyPointsApi = new GetLoyaltyPointsApi(client);
        this.getLoyaltyStoreOffersApi = new GetLoyaltyStoreOffersApi(client);
    }

    async getLoyaltyPoints(characterId: number): Promise<any> {
        return await this.getLoyaltyPointsApi.getLoyaltyPoints(characterId);
    }

    async getLoyaltyStoreOffers(corporationId: number): Promise<any> {
        return await this.getLoyaltyStoreOffersApi.getLoyaltyStoreOffers(corporationId);
    }
}
