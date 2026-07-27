 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { incursionEndpoints } from '../../core/endpoints/incursionEndpoints';
import { IncursionSchema } from '../../schemas/incursions';

export class GeneratedIncursionClient extends BaseEsiClient<typeof incursionEndpoints> {
  constructor(client: ApiClient) {
    super(client, incursionEndpoints);
  }

  /**
   * GET getIncursions
   */
  getIncursions(): Promise<(z.infer<typeof IncursionSchema>)[]> {
    return this.api.getIncursions() as Promise<(z.infer<typeof IncursionSchema>)[]>;
  }
}
