import { ApiClient } from '../core/ApiClient';
import { ContractsClient } from '../clients/ContractsClient';

export class ContractsApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): ContractsClient {
        return new ContractsClient(this.client);
    }
}
