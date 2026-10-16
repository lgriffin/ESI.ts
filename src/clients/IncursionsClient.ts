import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { incursionEndpoints } from '../core/endpoints/incursionEndpoints';
import { Incursion } from '../types/api-responses';

/**
 * A legacy domain client over the hand-written endpoint map.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. Use `createEsi()` from
 * `@lgriffin/esi.ts/client`: `esi.public` for public routes and
 * `esi.as(identity)` for authenticated ones. guides/LEGACY-REMOVAL.md
 * lists every legacy surface, its replacement and the open parity gaps.
 */
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
    return this.api.getIncursions();
  }
}
