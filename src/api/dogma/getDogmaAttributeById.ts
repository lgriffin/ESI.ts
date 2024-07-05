// src/api/dogma/getAttributeInfo.ts
import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class DogmaAttributeByIdApi {
    constructor(private client: ApiClient) {}

    async getAttributeById(attributeId: number): Promise<any> {
        return handleRequest(this.client, `dogma/attributes/${attributeId}`);
    }
}
