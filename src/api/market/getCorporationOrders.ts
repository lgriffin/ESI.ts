import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class getCorporationOrders {
    constructor(private client: ApiClient) {}

    async getCorporationOrders(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/orders/`, 'GET', undefined, true);
    }
}
