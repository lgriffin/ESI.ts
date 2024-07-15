import { ApiClient } from '../core/ApiClient';
import { IncursionsClient } from '../clients/IncursionsClient';
import { IncursionsApi } from '../api/incursions/getIncursions';

export class IncursionsApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): IncursionsClient {
        return new IncursionsClient(new IncursionsApi(this.client));
    }
}
