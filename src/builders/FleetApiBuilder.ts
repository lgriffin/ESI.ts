import { ApiClient } from '../core/ApiClient';
import { FleetClient } from '../clients/FleetClient';

export class FleetApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): FleetClient {
        return new FleetClient(this.client);
    }
}
