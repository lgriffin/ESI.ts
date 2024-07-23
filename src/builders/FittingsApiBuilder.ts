// src/builders/FittingsApiBuilder.ts

import { ApiClient } from '../core/ApiClient';
import { FittingsClient } from '../clients/FittingsClient';

export class FittingsApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): FittingsClient {
        return new FittingsClient(this.client);
    }
}
