import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseStructuresApi {
    constructor(private client: ApiClient) {}

    async getStructures(): Promise<number[]> {
        return handleRequest(this.client, `universe/structures`, 'GET', undefined, false);
    }
}
