import { ApiClient } from '../core/ApiClient';
import { CorporationsClient } from '../clients/CorporationsClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class CorporationsApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): CorporationsClient {
        return new CorporationsClient(this.client);
    }
}
