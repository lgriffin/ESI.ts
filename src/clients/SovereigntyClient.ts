import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { sovereigntyEndpoints } from '../core/endpoints/sovereigntyEndpoints';
import {
  SovereigntyCampaign,
  SovereigntyMap,
  SovereigntyStructure,
} from '../types/api-responses';

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
   * Retrieves the sovereignty ownership map showing which alliance holds each solar system.
   *
   * @returns A list of solar systems and their sovereignty holders
   */
  getSovereigntyMap(): Promise<SovereigntyMap[]> {
    return this.api.getSovereigntyMap() as Promise<SovereigntyMap[]>;
  }

  /**
   * Retrieves all sovereignty structures (TCUs, IHubs) and their vulnerability windows.
   *
   * @returns A list of sovereignty structures with their reinforcement and vulnerability details
   */
  getSovereigntyStructures(): Promise<SovereigntyStructure[]> {
    return this.api.getSovereigntyStructures() as Promise<
      SovereigntyStructure[]
    >;
  }
}
