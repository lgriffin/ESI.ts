import { ApiClient } from '../core/ApiClient';
import { CharacterSearchApi } from '../api/search/getCharacterSearch';
import { SearchClient } from '../clients/SearchClient';

export class SearchApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): SearchClient {
        return new SearchClient(
            new CharacterSearchApi(this.client)
        );
    }
}