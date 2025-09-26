import { ApiClient } from '../core/ApiClient';
import { FittingsClient } from '../clients/FittingsClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class FittingsApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): FittingsClient {
        return new FittingsClient(this.client);
    }
}
