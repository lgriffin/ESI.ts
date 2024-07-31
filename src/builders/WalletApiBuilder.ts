// src/builders/WalletApiBuilder.ts
import { ApiClient } from '../core/ApiClient';
import { WalletClient } from '../clients/WalletClient';

export class WalletApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): WalletClient {
        return new WalletClient(this.client);
    }
}
