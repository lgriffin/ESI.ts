import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { skyhookEndpoints } from '../core/endpoints/skyhookEndpoints';
import {
  SovereigntyHub,
  OrbitalSkyhook,
  RaidableSkyhook,
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
}
