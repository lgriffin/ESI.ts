// src/api/dogma/getAttributes.ts
import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class DogmaAttributesApi {
    constructor(private client: ApiClient) {}

    async getAttributes(): Promise<any> {
        return handleRequest(this.client, 'dogma/attributes');
    }
}
