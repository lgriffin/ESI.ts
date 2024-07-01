import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostBulkNamesToIdsApi {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    async postBulkNamesToIds(ids: number[]): Promise<any> {
        const payload = JSON.stringify({ ids });
        return await handleRequest(this.client, 'universe/ids', 'POST', payload);
    }
}
