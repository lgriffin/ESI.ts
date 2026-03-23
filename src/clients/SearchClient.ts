import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { searchEndpoints } from '../core/endpoints/searchEndpoints';
import { SearchResult } from '../types/api-responses';

export class SearchClient {
    private api: ReturnType<typeof createClient<typeof searchEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, searchEndpoints);
    }

    async characterSearch(characterId: number, searchString: string): Promise<SearchResult> {
        return this.api.searchCharacter(characterId, searchString);
    }
}
