import { ApiClient } from '../core/ApiClient';
import { AssetsClient } from '../clients/AssetsClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class AssetsApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): AssetsClient {
        return new AssetsClient(this.client);
    }
}
