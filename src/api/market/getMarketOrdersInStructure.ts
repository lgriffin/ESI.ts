import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class getMarketOrdersInStructure {
    constructor(private client: ApiClient) {}

    async getMarketOrdersInStructure(structureId: number): Promise<any> {
        return handleRequest(this.client, `markets/structures/${structureId}/`, 'GET');
    }
}
