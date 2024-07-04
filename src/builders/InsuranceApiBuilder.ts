import { ApiClient } from '../core/ApiClient';
import { InsuranceClient } from '../clients/InsuranceClient';

export class InsuranceAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): InsuranceClient {
        return new InsuranceClient(this.client);
    }
}
