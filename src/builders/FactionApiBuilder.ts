import { ApiClient } from '../core/ApiClient';
import { FactionClient } from '../clients/FactionClient';
import { IAPIBuilder } from '../core/IAPIBuilder'; 

export class FactionAPIBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): FactionClient {
        return new FactionClient(this.client);
    }
}
