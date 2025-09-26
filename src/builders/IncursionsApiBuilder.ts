import { ApiClient } from '../core/ApiClient';
import { IncursionsClient } from '../clients/IncursionsClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class IncursionsApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): IncursionsClient {
        return new IncursionsClient(this.client);
    }
}
