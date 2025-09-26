import { ApiClient } from '../core/ApiClient';
import { MarketClient } from '../clients/MarketClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class MarketApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): MarketClient {
        return new MarketClient(this.client);
    }
}
