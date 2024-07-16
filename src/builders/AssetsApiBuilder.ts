import { ApiClient } from '../core/ApiClient';
import { AssetsClient } from '../clients/AssetsClient';

export class AssetsApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): AssetsClient {
        return new AssetsClient(this.client);
    }
}
