import { ApiClient } from '../core/ApiClient';
import { FleetClient } from '../clients/FleetClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class FleetApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): FleetClient {
        return new FleetClient(this.client);
    }
}
