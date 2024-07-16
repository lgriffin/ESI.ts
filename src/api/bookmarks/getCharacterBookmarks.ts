import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class CharacterBookmarksApi {
    constructor(private client: ApiClient) {}

    async getCharacterBookmarks(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/bookmarks`);
    }
}
