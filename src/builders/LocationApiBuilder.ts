import { ApiClient } from '../core/ApiClient';
import { LocationClient } from '../clients/LocationClient';

export class LocationApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): LocationClient {
        return new LocationClient(this.client);
    }
}
