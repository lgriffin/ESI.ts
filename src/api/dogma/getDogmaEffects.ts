// src/api/dogma/getEffects.ts
import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class DogmaEffectsApi {
    constructor(private client: ApiClient) {}

    async getEffects(): Promise<any> {
        return handleRequest(this.client, 'dogma/effects', 'GET', undefined, false);
    }
}
