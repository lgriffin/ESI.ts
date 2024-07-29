// src/api/dogma/getEffectInfo.ts
import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class DogmaEffectByIdApi {
    constructor(private client: ApiClient) {}

    async getEffectById(effectId: number): Promise<any> {
        return handleRequest(this.client, `dogma/effects/${effectId}`, 'GET', undefined, false);
    }
}
