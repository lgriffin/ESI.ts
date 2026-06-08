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
   * @returns A list of sovereignty hubs
   */
  getSovereigntyHubs(): Promise<SovereigntyHub[]> {
    return this.api.getSovereigntyHubs() as Promise<SovereigntyHub[]>;
  }

  /**
   * Retrieves all orbital skyhooks with their silo capacity and levels.
   *
   * @returns A list of orbital skyhooks
   */
  getOrbitalSkyhooks(): Promise<OrbitalSkyhook[]> {
    return this.api.getOrbitalSkyhooks() as Promise<OrbitalSkyhook[]>;
  }

  /**
   * Retrieves the rolling list of skyhooks that are currently or becoming raidable across New Eden.
   *
   * @returns A list of raidable skyhooks
   */
  getRaidableSkyhooks(): Promise<RaidableSkyhook[]> {
    return this.api.getRaidableSkyhooks() as Promise<RaidableSkyhook[]>;
  }
}
