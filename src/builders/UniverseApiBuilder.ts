import { ApiClient } from '../core/ApiClient';
import { UniverseClient } from '../clients/UniverseClient';

export class UniverseAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): UniverseClient {
        return new UniverseClient(this.client);
    }
}
