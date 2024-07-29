import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseSystemJumpsApi {
    constructor(private client: ApiClient) {}

    async getSystemJumps(): Promise<object[]> {
        return handleRequest(this.client, `universe/system_jumps`, 'GET', undefined, false);
    }
}
