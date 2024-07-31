import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class getMarketOrders {
    constructor(private client: ApiClient) {}

    async getMarketOrders(regionId: number, orderType: string = 'all'): Promise<any> {
        return handleRequest(this.client, `markets/${regionId}/orders/?order_type=${orderType}`, 'GET');
    }
}
