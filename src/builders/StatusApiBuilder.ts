import { ApiClient } from '../core/ApiClient';
import { StatusClient } from '../clients/StatusClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class StatusAPIBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): StatusClient {
        return new StatusClient(this.client);
    }
}
