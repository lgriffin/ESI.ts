import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { searchEndpoints } from '../core/endpoints/searchEndpoints';
import { SearchResult } from '../types/api-responses';

export class SearchClient extends BaseEsiClient<typeof searchEndpoints> {
  constructor(client: ApiClient) {
    super(client, searchEndpoints);
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
}
