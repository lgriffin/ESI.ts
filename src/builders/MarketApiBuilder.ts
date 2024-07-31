import { ApiClient } from '../core/ApiClient';
import { MarketClient } from '../clients/MarketClient';

export class MarketApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): MarketClient {
        return new MarketClient(this.client);
    }
}
