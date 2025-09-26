import { ApiClient } from '../core/ApiClient';
import { UniverseClient } from '../clients/UniverseClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class UniverseAPIBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): UniverseClient {
        return new UniverseClient(this.client);
    }
}
