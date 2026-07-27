/* eslint-disable */
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { fittingEndpoints } from '../../core/endpoints/fittingEndpoints';
import { FittingSchema } from '../../schemas/fittings';

export class GeneratedFittingClient extends BaseEsiClient<typeof fittingEndpoints> {
  constructor(client: ApiClient) {
    super(client, fittingEndpoints);
  }

  /**
   * GET getFittings
   * @requires Authentication
   */
  getFittings(characterId: number | string): Promise<(z.infer<typeof FittingSchema>)[]> {
    return this.api.getFittings(characterId) as Promise<(z.infer<typeof FittingSchema>)[]>;
  }

  /**
   * POST createFitting
   * @requires Authentication
   */
  createFitting(characterId: number | string, body: unknown): Promise<unknown> {
    return (this.api.createFitting as any)(characterId, body) as Promise<unknown>;
  }

  /**
   * DELETE deleteFitting
   * @requires Authentication
   */
  deleteFitting(characterId: number | string, fittingId: number | string): Promise<unknown> {
    return this.api.deleteFitting(characterId, fittingId) as Promise<unknown>;
  }
}
