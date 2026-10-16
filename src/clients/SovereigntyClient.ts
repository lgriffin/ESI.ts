import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { sovereigntyEndpoints } from '../core/endpoints/sovereigntyEndpoints';
import { SovereigntyCampaign, SovereigntySystem } from '../types/api-responses';

/**
 * A legacy domain client over the hand-written endpoint map.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. Use `createEsi()` from
 * `@lgriffin/esi.ts/client`: `esi.public` for public routes and
 * `esi.as(identity)` for authenticated ones. guides/LEGACY-REMOVAL.md
 * lists every legacy surface, its replacement and the open parity gaps.
 */
export class SovereigntyClient extends BaseEsiClient<
  typeof sovereigntyEndpoints
> {
  constructor(client: ApiClient) {
    super(client, sovereigntyEndpoints);
  }

  /**
   * Retrieves all active sovereignty campaigns, including command node contests and station freeports.
   *
   * @returns A list of active sovereignty campaigns
   */
  getSovereigntyCampaigns(): Promise<SovereigntyCampaign[]> {
    return this.api.getSovereigntyCampaigns();
  }

  /**
   * Retrieves the combined sovereignty systems data including occupancy, structures, and separate ADM indices (military, industry, strategic).
   *
   * @returns A list of sovereignty systems with ownership, ADM indices, and anchored structures
   */
  getSovereigntySystems(): Promise<SovereigntySystem> {
    return this.api.getSovereigntySystems();
  }
}
