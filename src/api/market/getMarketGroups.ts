import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class getMarketGroups {
    constructor(private client: ApiClient) {}

    async getMarketGroups(): Promise<any> {
        return handleRequest(this.client, 'markets/groups/', 'GET');
    }
}
