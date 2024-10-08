import { ApiClient } from '../core/ApiClient';
import { StatusClient } from '../clients/StatusClient';

export class StatusAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): StatusClient {
        return new StatusClient(this.client);
    }
}
