import { ApiClient } from '../core/ApiClient';
import { SovereigntyClient } from '../clients/SovereigntyClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class SovereigntyApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): SovereigntyClient {
        return new SovereigntyClient(this.client);
    }
}
