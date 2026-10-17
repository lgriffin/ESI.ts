import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { searchEndpoints } from '../core/endpoints/searchEndpoints';
import { SearchResult } from '../types/api-responses';

/**
 * A legacy domain client over the hand-written endpoint map.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. Use `createEsi()` from
 * `@lgriffin/esi.ts/client`: `esi.public` for public routes and
 * `esi.as(identity)` for authenticated ones. guides/LEGACY-REMOVAL.md
 * lists every legacy surface, its replacement and the open parity gaps.
 */
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
    );
  }
}
