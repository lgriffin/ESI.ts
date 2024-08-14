import { ApiClient } from '../core/ApiClient';
import { CharacterSearchApi } from '../api/search/getCharacterSearch';

export class SearchClient {
    private characterSearchApi: CharacterSearchApi;

    constructor(client: ApiClient) {
        this.characterSearchApi = new CharacterSearchApi(client);
    }

    async characterSearch(characterId: number, searchString: string): Promise<object> {
        return this.characterSearchApi.searchCharacter(characterId, searchString);
    }
}
