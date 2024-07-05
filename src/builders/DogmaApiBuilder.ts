// src/builders/DogmaAPIBuilder.ts
import { ApiClient } from '../core/ApiClient';
import { DogmaClient } from '../clients/DogmaClient';

export class DogmaAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): DogmaClient {
        return new DogmaClient(this.client);
    }
}
