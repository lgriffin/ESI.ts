import { ApiClient } from '../core/ApiClient';
import { WarsClient } from '../clients/WarsClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class WarsAPIBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): WarsClient {
        return new WarsClient(this.client);
    }
}
