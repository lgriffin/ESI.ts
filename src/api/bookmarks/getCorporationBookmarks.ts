import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class CorporationBookmarksApi {
    constructor(private client: ApiClient) {}

    async getCorporationBookmarks(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/bookmarks`, 'GET', undefined, true);
    }
}
