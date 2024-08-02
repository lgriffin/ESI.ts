import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class getFactionWarfareStats {
    constructor(private client: ApiClient) {}

    async getStats(): Promise<object> {
        return await handleRequest(this.client, 'fw/stats', 'GET', undefined, false);
    }
}
