import { ApiClient } from '../core/ApiClient';
import { LocationClient } from '../clients/LocationClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class LocationApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): LocationClient {
        return new LocationClient(this.client);
    }
}
