 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { searchEndpoints } from '../../core/endpoints/searchEndpoints';
import { SearchResultSchema } from '../../schemas/universe';

export class GeneratedSearchClient extends BaseEsiClient<typeof searchEndpoints> {
  constructor(client: ApiClient) {
    super(client, searchEndpoints);
  }

  /**
   * GET searchCharacter
   * @requires Authentication
   */
  searchCharacter(characterId: number | string, searchString?: string | number | boolean, categories?: string | number | boolean): Promise<z.infer<typeof SearchResultSchema>> {
    return this.api.searchCharacter(characterId, searchString, categories) as Promise<z.infer<typeof SearchResultSchema>>;
  }
}
