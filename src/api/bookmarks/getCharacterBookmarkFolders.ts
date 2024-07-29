import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class CharacterBookmarkFoldersApi {
    constructor(private client: ApiClient) {}

    async getCharacterBookmarkFolders(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/bookmarks/folders`, 'GET', undefined, true);
    }
}
