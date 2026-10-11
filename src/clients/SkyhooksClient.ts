import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { skyhookEndpoints } from '../core/endpoints/skyhookEndpoints';
import {
  SovereigntyHubsResponse,
  OrbitalSkyhooksResponse,
  RaidableSkyhooksResponse,
  SkyhookDetail,
  SovereigntyHubDetail,
} from '../types/api-responses';

export class SkyhooksClient extends BaseEsiClient<typeof skyhookEndpoints> {
  constructor(client: ApiClient) {
    super(client, skyhookEndpoints);
  }

  /**
   * Retrieves the sovereignty hubs a corporation owns. Call `getSovereigntyHubDetail` for a hub's
   * upgrades, reagent bay and resources.
   *
   * @param corporationId - The ID of the corporation to query sovereignty hubs for
   * @returns ESI's response as sent: `sovereignty_hubs`, one entry per hub with its `id` and
   *   `solar_system_id`
   * @requires Authentication
   */
  getSovereigntyHubs(corporationId: number): Promise<SovereigntyHubsResponse> {
    return this.api.getSovereigntyHubs(corporationId);
  }

  /**
   * Retrieves the orbital skyhooks a corporation owns. Call `getSkyhookDetail` for a skyhook's
   * state, reagent stock and theft window.
   *
   * @param corporationId - The ID of the corporation to query skyhooks for
   * @returns ESI's response as sent: `skyhooks`, one entry per skyhook with its `id` and
   *   `planet_id`
   * @requires Authentication
   */
  getOrbitalSkyhooks(corporationId: number): Promise<OrbitalSkyhooksResponse> {
    return this.api.getOrbitalSkyhooks(corporationId);
  }

  /**
   * Retrieves the rolling list of skyhooks that are currently or becoming raidable across New Eden.
   *
   * @returns ESI's response as sent: `skyhooks`, one entry per skyhook with its
   *   planet, solar system and theft vulnerability window
   */
  getRaidableSkyhooks(): Promise<RaidableSkyhooksResponse> {
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
