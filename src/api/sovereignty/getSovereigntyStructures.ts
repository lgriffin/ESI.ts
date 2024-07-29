import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class SovereigntyStructuresApi {
    constructor(private client: ApiClient) {}

    async getSovereigntyStructures(): Promise<any> {
        return handleRequest(this.client, 'sovereignty/structures', 'GET', undefined, false);
    }
}
