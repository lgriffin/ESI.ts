import { ApiClient } from '../core/ApiClient';
import { MetaClient } from '../clients/MetaClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class MetaApiBuilder implements IAPIBuilder<MetaClient> {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): MetaClient {
        return new MetaClient(this.client);
    }
}
