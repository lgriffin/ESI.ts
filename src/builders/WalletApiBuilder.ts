// src/builders/WalletApiBuilder.ts
import { ApiClient } from '../core/ApiClient';
import { WalletClient } from '../clients/WalletClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class WalletApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): WalletClient {
        return new WalletClient(this.client);
    }
}
