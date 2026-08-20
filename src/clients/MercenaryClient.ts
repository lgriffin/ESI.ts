import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { mercenaryEndpoints } from '../core/endpoints/mercenaryEndpoints';
import {
  MercenaryDen,
  MercenaryTacticalOperation,
  MercenaryDenDetail,
  MercenaryTacticalOperationDetail,
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

  /**
   * Retrieves detail for a specific mercenary den including evolution, infomorphs, and skyhook attachment.
   *
   * @param characterId - The ID of the character
   * @param mercenaryDenId - The ID of the mercenary den
   * @returns Mercenary den detail
   * @requires Authentication
   */
  getMercenaryDenDetail(
    characterId: number,
    mercenaryDenId: number,
  ): Promise<MercenaryDenDetail> {
    return this.api.getMercenaryDenDetail(characterId, mercenaryDenId);
  }

  /**
   * Retrieves detail for a specific mercenary tactical operation.
   *
   * @param characterId - The ID of the character
   * @param operationId - The UUID of the tactical operation
   * @returns Mercenary tactical operation detail
   * @requires Authentication
   */
  getMercenaryTacticalOperationDetail(
    characterId: number,
    operationId: string,
  ): Promise<MercenaryTacticalOperationDetail> {
    return this.api.getMercenaryTacticalOperationDetail(
      characterId,
      operationId,
    );
  }
}
