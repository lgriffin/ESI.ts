import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { fittingEndpoints } from '../core/endpoints/fittingEndpoints';
import { Fitting } from '../types/api-responses';
import { PageResult } from '../core/pagination/AsyncPaginationIterator';

/**
 * A legacy domain client over the hand-written endpoint map.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. Use `createEsi()` from
 * `@lgriffin/esi.ts/client`: `esi.public` for public routes and
 * `esi.as(identity)` for authenticated ones. guides/LEGACY-REMOVAL.md
 * lists every legacy surface, its replacement and the open parity gaps.
 */
export class FittingsClient extends BaseEsiClient<typeof fittingEndpoints> {
  constructor(client: ApiClient) {
    super(client, fittingEndpoints);
  }

  /**
   * Retrieves all saved ship fittings for a character.
   *
   * @param characterId - The ID of the character
   * @returns An array of the character's saved fittings
   * @requires Authentication
   */
  getFittings(characterId: number): Promise<Fitting[]> {
    return this.api.getFittings(characterId);
  }

  /**
   * Creates a new saved ship fitting for a character via POST.
   *
   * @param characterId - The ID of the character
   * @param fittingData - The fitting details including ship type and module layout
   * @returns The ID of the newly created fitting
   * @requires Authentication
   */
  createFitting(
    characterId: number,
    fittingData: object,
  ): Promise<{ fitting_id: number }> {
    return this.api.createFitting(characterId, fittingData);
  }

  /**
   * Deletes a saved ship fitting for a character.
   *
   * @param characterId - The ID of the character
   * @param fittingId - The ID of the fitting to delete
   * @requires Authentication
   */
  deleteFitting(characterId: number, fittingId: number): Promise<void> {
    return this.api.deleteFitting(characterId, fittingId) as Promise<void>;
  }

  fetchAllFittings(
    characterId: number,
    concurrency?: number,
  ): Promise<Fitting[]> {
    return this.fetchAllEndpoint<Fitting>(
      'getFittings',
      [characterId],
      concurrency,
    );
  }

  streamFittings(
    characterId: number,
  ): AsyncGenerator<PageResult<Fitting>, void, undefined> {
    return this.streamEndpoint<Fitting>('getFittings', characterId);
  }
}
