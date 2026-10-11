import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { mercenaryEndpoints } from '../core/endpoints/mercenaryEndpoints';
import {
  MercenaryDensResponse,
  MercenaryTacticalOperationsResponse,
  MercenaryDenDetail,
  MercenaryTacticalOperationDetail,
} from '../types/api-responses';

export class MercenaryClient extends BaseEsiClient<typeof mercenaryEndpoints> {
  constructor(client: ApiClient) {
    super(client, mercenaryEndpoints);
  }

  /**
   * Retrieves the mercenary dens a character owns. Call `getMercenaryDenDetail` for a den's
   * evolution, infomorphs and skyhook.
   *
   * @param characterId - The ID of the character to query mercenary dens for
   * @returns ESI's response as sent: `mercenary_dens`, one entry per den with its `id` and
   *   `planet_id`
   * @requires Authentication
   */
  getMercenaryDens(characterId: number): Promise<MercenaryDensResponse> {
    return this.api.getMercenaryDens(characterId);
  }

  /**
   * Retrieves all mercenary tactical operations (MTOs) spawned from mercenary dens.
   *
   * @param characterId - The ID of the character to query tactical operations for
   * @returns ESI's response as sent: `operations`, one entry per operation with its UUID `id`
   *   and the `mercenary_den_id` it spawned from
   * @requires Authentication
   */
  getMercenaryTacticalOperations(
    characterId: number,
  ): Promise<MercenaryTacticalOperationsResponse> {
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
