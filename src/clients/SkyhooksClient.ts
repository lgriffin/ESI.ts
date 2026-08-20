import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { skyhookEndpoints } from '../core/endpoints/skyhookEndpoints';
import {
  SovereigntyHub,
  OrbitalSkyhook,
  RaidableSkyhook,
  SkyhookDetail,
  SovereigntyHubDetail,
} from '../types/api-responses';

export class SkyhooksClient extends BaseEsiClient<typeof skyhookEndpoints> {
  constructor(client: ApiClient) {
    super(client, skyhookEndpoints);
  }

  /**
   * Retrieves all sovereignty hubs exposed as Upwell structures, including online status and installed upgrades.
   *
   * @param corporationId - The ID of the corporation to query sovereignty hubs for
   * @returns A list of sovereignty hubs
   * @requires Authentication
   */
  getSovereigntyHubs(corporationId: number): Promise<SovereigntyHub[]> {
    return this.api.getSovereigntyHubs(corporationId);
  }

  /**
   * Retrieves all orbital skyhooks with their silo capacity and levels.
   *
   * @param corporationId - The ID of the corporation to query skyhooks for
   * @returns A list of orbital skyhooks
   * @requires Authentication
   */
  getOrbitalSkyhooks(corporationId: number): Promise<OrbitalSkyhook[]> {
    return this.api.getOrbitalSkyhooks(corporationId);
  }

  /**
   * Retrieves the rolling list of skyhooks that are currently or becoming raidable across New Eden.
   *
   * @returns A list of raidable skyhooks
   */
  getRaidableSkyhooks(): Promise<RaidableSkyhook[]> {
    return this.api.getRaidableSkyhooks();
  }

  /**
   * Retrieves detail for a specific skyhook including reagents, reinforcement timer, and theft vulnerability.
   *
   * @param corporationId - The ID of the corporation
   * @param skyhookId - The ID of the skyhook
   * @returns Skyhook detail
   * @requires Authentication
   */
  getSkyhookDetail(
    corporationId: number,
    skyhookId: number,
  ): Promise<SkyhookDetail> {
    return this.api.getSkyhookDetail(corporationId, skyhookId);
  }

  /**
   * Retrieves detail for a specific sovereignty hub including reagent bay, resources, upgrades, and vulnerability window.
   *
   * @param corporationId - The ID of the corporation
   * @param sovereigntyHubId - The ID of the sovereignty hub
   * @returns Sovereignty hub detail
   * @requires Authentication
   */
  getSovereigntyHubDetail(
    corporationId: number,
    sovereigntyHubId: number,
  ): Promise<SovereigntyHubDetail> {
    return this.api.getSovereigntyHubDetail(corporationId, sovereigntyHubId);
  }
}
