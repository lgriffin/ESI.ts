import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class getMarketGroupInformation {
    constructor(private client: ApiClient) {}

    async getMarketGroupInformation(marketGroupId: number): Promise<any> {
        return handleRequest(this.client, `markets/groups/${marketGroupId}/`, 'GET');
    }
}
