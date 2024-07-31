import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class getMarketHistory {
    constructor(private client: ApiClient) {}

    async getMarketHistory(regionId: number, typeId: number): Promise<any> {
        return handleRequest(this.client, `markets/${regionId}/history/?type_id=${typeId}`, 'GET');
    }
}
