import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { fittingEndpoints } from '../core/endpoints/fittingEndpoints';
import { Fitting } from '../types/api-responses';

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
    return this.api.getFittings(characterId) as Promise<Fitting[]>;
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
    return this.api.createFitting(characterId, fittingData) as Promise<{
      fitting_id: number;
    }>;
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
}
