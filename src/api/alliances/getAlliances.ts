import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class AllAlliancesApi {
    constructor(private client: ApiClient) {}

    async getAllAlliances(): Promise<object[]> {
        return handleRequest(this.client, 'alliances', 'GET', undefined, false);
    }
}
