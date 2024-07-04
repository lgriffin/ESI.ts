import { ApiClient } from '../core/ApiClient';
import { WarsClient } from '../clients/WarsClient';

export class WarsAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): WarsClient {
        return new WarsClient(this.client);
    }
}
