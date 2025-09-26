import { ApiClient } from '../core/ApiClient';
import { InsuranceClient } from '../clients/InsuranceClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class InsuranceAPIBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): InsuranceClient {
        return new InsuranceClient(this.client);
    }
}
