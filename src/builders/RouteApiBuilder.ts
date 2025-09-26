import { ApiClient } from '../core/ApiClient';
import { RouteClient } from '../clients/RouteClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class RouteApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): RouteClient {
        return new RouteClient(this.client);
    }
}
