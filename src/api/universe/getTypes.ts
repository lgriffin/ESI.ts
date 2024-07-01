import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseTypesApi {
    constructor(private client: ApiClient) {}

    async getTypes(): Promise<number[]> {
        return handleRequest(this.client, `universe/types`);
    }
}
