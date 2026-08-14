import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { mercenaryEndpoints } from '../core/endpoints/mercenaryEndpoints';
import {
  MercenaryDen,
  MercenaryTacticalOperation,
} from '../types/api-responses';

export class MercenaryClient extends BaseEsiClient<typeof mercenaryEndpoints> {
  constructor(client: ApiClient) {
    super(client, mercenaryEndpoints);
  }

  /**
   * Retrieves all mercenary dens with their development and anarchy parameters.
   *
   * @param characterId - The ID of the character to query mercenary dens for
   * @returns A list of mercenary dens
   * @requires Authentication
   */
  getMercenaryDens(characterId: number): Promise<MercenaryDen[]> {
    return this.api.getMercenaryDens(characterId);
  }

  /**
   * Retrieves all mercenary tactical operations (MTOs) spawned from mercenary dens.
   *
   * @param characterId - The ID of the character to query tactical operations for
   * @returns A list of mercenary tactical operations
   * @requires Authentication
   */
  getMercenaryTacticalOperations(
    characterId: number,
  ): Promise<MercenaryTacticalOperation[]> {
    return this.api.getMercenaryTacticalOperations(characterId);
  }
}
