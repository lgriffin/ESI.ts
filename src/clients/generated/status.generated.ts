 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { statusEndpoints } from '../../core/endpoints/statusEndpoints';
import { ServerStatusSchema } from '../../schemas/status';

export class GeneratedStatusClient extends BaseEsiClient<typeof statusEndpoints> {
  constructor(client: ApiClient) {
    super(client, statusEndpoints);
  }

  /**
   * GET getStatus
   */
  getStatus(): Promise<z.infer<typeof ServerStatusSchema>> {
    return this.api.getStatus() as Promise<z.infer<typeof ServerStatusSchema>>;
  }
}
