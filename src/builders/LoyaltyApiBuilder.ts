import { ApiClient } from '../core/ApiClient';
import { LoyaltyClient } from '../clients/LoyaltyClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class LoyaltyApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): LoyaltyClient {
        return new LoyaltyClient(this.client);
    }
}
