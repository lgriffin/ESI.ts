import { ApiClient } from '../core/ApiClient';
import { CorporationsClient } from '../clients/CorporationsClient';

export class CorporationsApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): CorporationsClient {
        return new CorporationsClient(this.client);
    }
}
