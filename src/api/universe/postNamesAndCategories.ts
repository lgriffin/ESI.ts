import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostNamesAndCategoriesApi {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    async postNamesAndCategories(ids: number[]): Promise<any> {
        const payload = JSON.stringify({ ids });
        return await handleRequest(this.client, 'universe/names', 'POST', payload);
    }
}
