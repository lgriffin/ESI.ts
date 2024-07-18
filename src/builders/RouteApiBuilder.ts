import { ApiClient } from '../core/ApiClient';
import { RouteClient } from '../clients/RouteClient';

export class RouteApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): RouteClient {
        return new RouteClient(this.client);
    }
}
