import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { sovereigntyEndpoints } from '../core/endpoints/sovereigntyEndpoints';
import { SovereigntyCampaign, SovereigntySystem } from '../types/api-responses';

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
    return this.api.getSovereigntyCampaigns() as Promise<SovereigntyCampaign[]>;
  }

  /**
   * Retrieves the combined sovereignty systems data including occupancy, structures, and separate ADM indices (military, industry, strategic).
   *
   * @returns A list of sovereignty systems with ownership, ADM indices, and anchored structures
   */
  getSovereigntySystems(): Promise<SovereigntySystem> {
    return this.api.getSovereigntySystems() as Promise<SovereigntySystem>;
  }
}
