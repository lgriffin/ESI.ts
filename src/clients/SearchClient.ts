import { ApiClient } from '../core/ApiClient';
import { handleRequest } from '../core/ApiRequestHandler';

export class SearchClient {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    async characterSearch(characterId: number, searchString: string): Promise<object> {
        return handleRequest(this.client, `characters/${characterId}/search?search=${searchString}`, 'GET', undefined, true);
    }
}
