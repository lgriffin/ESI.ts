import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { searchEndpoints } from '../core/endpoints/searchEndpoints';
import { SearchResult } from '../types/api-responses';

export class SearchClient {
  private api: ReturnType<typeof createClient<typeof searchEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<typeof createClient<typeof searchEndpoints>>;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, searchEndpoints);
  }

  /**
   * Searches for entities matching a query string on behalf of a character.
   *
   * @param characterId - The ID of the character performing the search
   * @param searchString - The search query string to match against
   * @returns Search results grouped by entity category
   * @requires Authentication
   */
  characterSearch(
    characterId: number,
    searchString: string,
    categories: string[],
  ): Promise<SearchResult> {
    return this.api.searchCharacter(
      characterId,
      searchString,
      categories.join(','),
    ) as Promise<SearchResult>;
  }

  withMetadata(): WithMetadata<Omit<SearchClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, searchEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<SearchClient, 'withMetadata'>
    >;
  }
}
