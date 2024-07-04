import { ApiClient } from '../core/ApiClient';
import { FactionClient } from '../clients/FactionClient'; 

export class FactionAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): FactionClient {
        return new FactionClient(this.client);
    }
}
