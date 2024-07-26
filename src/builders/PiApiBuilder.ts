import { ApiClient } from '../core/ApiClient';
import { PIClient } from '../clients/PiClient';

export class PiApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): PIClient {
        return new PIClient(this.client);
    }
}
