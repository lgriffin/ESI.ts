import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class getMarketTypes {
    constructor(private client: ApiClient) {}

    async getMarketTypes(regionId: number): Promise<any> {
        return handleRequest(this.client, `markets/${regionId}/types/`, 'GET');
    }
}
