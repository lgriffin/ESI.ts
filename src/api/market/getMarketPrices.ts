import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class getMarketPrices {
    constructor(private client: ApiClient) {}

    async getMarketPrices(): Promise<any> {
        return handleRequest(this.client, 'markets/prices/', 'GET');
    }
}
