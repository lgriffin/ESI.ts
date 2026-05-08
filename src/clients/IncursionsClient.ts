import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { incursionEndpoints } from '../core/endpoints/incursionEndpoints';
import { Incursion } from '../types/api-responses';

export class IncursionsClient extends BaseEsiClient<typeof incursionEndpoints> {
  constructor(client: ApiClient) {
    super(client, incursionEndpoints);
  }

  /**
   * Retrieves all currently active incursions, including their staging systems and influence levels.
   *
   * @returns An array of active incursions
   */
  getIncursions(): Promise<Incursion[]> {
    return this.api.getIncursions() as Promise<Incursion[]>;
  }
}
