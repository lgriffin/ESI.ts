import { ApiClient } from '../core/ApiClient';
import { IncursionsClient } from '../clients/IncursionsClient';

export class IncursionsApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): IncursionsClient {
        return new IncursionsClient(this.client);
    }
}
