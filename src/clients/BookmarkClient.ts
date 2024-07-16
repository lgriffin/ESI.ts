import { CharacterBookmarksApi } from '../api/bookmarks/getCharacterBookmarks';
import { CharacterBookmarkFoldersApi } from '../api/bookmarks/getCharacterBookmarkFolders';
import { CorporationBookmarksApi } from '../api/bookmarks/getCorporationBookmarks';
import { CorporationBookmarkFoldersApi } from '../api/bookmarks/getCorporationBookmarkFolders';
import { ApiClient } from '../core/ApiClient';

export class BookmarkClient {
    private characterBookmarksApi: CharacterBookmarksApi;
    private characterBookmarkFoldersApi: CharacterBookmarkFoldersApi;
    private corporationBookmarksApi: CorporationBookmarksApi;
    private corporationBookmarkFoldersApi: CorporationBookmarkFoldersApi;

    constructor(client: ApiClient) {
        this.characterBookmarksApi = new CharacterBookmarksApi(client);
        this.characterBookmarkFoldersApi = new CharacterBookmarkFoldersApi(client);
        this.corporationBookmarksApi = new CorporationBookmarksApi(client);
        this.corporationBookmarkFoldersApi = new CorporationBookmarkFoldersApi(client);
    }

    async getCharacterBookmarks(characterId: number): Promise<any> {
        return this.characterBookmarksApi.getCharacterBookmarks(characterId);
    }

    async getCharacterBookmarkFolders(characterId: number): Promise<any> {
        return this.characterBookmarkFoldersApi.getCharacterBookmarkFolders(characterId);
    }

    async getCorporationBookmarks(corporationId: number): Promise<any> {
        return this.corporationBookmarksApi.getCorporationBookmarks(corporationId);
    }

    async getCorporationBookmarkFolders(corporationId: number): Promise<any> {
        return this.corporationBookmarkFoldersApi.getCorporationBookmarkFolders(corporationId);
    }
}
