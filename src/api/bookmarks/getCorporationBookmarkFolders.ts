import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class CorporationBookmarkFoldersApi {
    constructor(private client: ApiClient) {}

    async getCorporationBookmarkFolders(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/bookmarks/folders`, 'GET', undefined, true);
    }
}
