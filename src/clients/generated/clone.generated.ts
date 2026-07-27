 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { cloneEndpoints } from '../../core/endpoints/cloneEndpoints';
import { CloneInfoSchema } from '../../schemas/clones';

export class GeneratedCloneClient extends BaseEsiClient<typeof cloneEndpoints> {
  constructor(client: ApiClient) {
    super(client, cloneEndpoints);
  }

  /**
   * GET getClones
   * @requires Authentication
   */
  getClones(characterId: number | string): Promise<z.infer<typeof CloneInfoSchema>> {
    return this.api.getClones(characterId) as Promise<z.infer<typeof CloneInfoSchema>>;
  }

  /**
   * GET getImplants
   * @requires Authentication
   */
  getImplants(characterId: number | string): Promise<number[]> {
    return this.api.getImplants(characterId) as Promise<number[]>;
  }
}
