import { ApiClient } from '../core/ApiClient';
import { LoyaltyClient } from '../clients/LoyaltyClient';

export class LoyaltyApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): LoyaltyClient {
        return new LoyaltyClient(this.client);
    }
}
