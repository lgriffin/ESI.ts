import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class getCorporationOrderHistory {
    constructor(private client: ApiClient) {}

    async getCorporationOrderHistory(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/orders/history/`, 'GET', undefined, true);
    }
}
