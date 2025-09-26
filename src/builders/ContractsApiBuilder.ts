import { ApiClient } from '../core/ApiClient';
import { ContractsClient } from '../clients/ContractsClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class ContractsApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): ContractsClient {
        return new ContractsClient(this.client);
    }
}
