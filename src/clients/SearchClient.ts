import { CharacterSearchApi } from '../api/search/getCharacterSearch';

export class SearchClient {
    private characterSearchApi: CharacterSearchApi;

    constructor(characterSearchApi: CharacterSearchApi) {
        this.characterSearchApi = characterSearchApi;
    }

    async searchCharacter(characterId: number, searchString: string): Promise<any> {
        return await this.characterSearchApi.searchCharacter(characterId, searchString);
    }
}
