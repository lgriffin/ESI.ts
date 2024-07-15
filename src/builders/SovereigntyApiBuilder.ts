import { ApiClient } from '../core/ApiClient';
import { SovereigntyClient } from '../clients/SovereigntyClient';

export class SovereigntyApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): SovereigntyClient {
        return new SovereigntyClient(this.client);
    }
}
