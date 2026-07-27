 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { mercenaryEndpoints } from '../../core/endpoints/mercenaryEndpoints';
import { MercenaryDenSchema, MercenaryTacticalOperationSchema } from '../../schemas/mercenary';

export class GeneratedMercenaryClient extends BaseEsiClient<typeof mercenaryEndpoints> {
  constructor(client: ApiClient) {
    super(client, mercenaryEndpoints);
  }

  /**
   * GET getMercenaryDens
   */
  getMercenaryDens(): Promise<(z.infer<typeof MercenaryDenSchema>)[]> {
    return this.api.getMercenaryDens() as Promise<(z.infer<typeof MercenaryDenSchema>)[]>;
  }

  /**
   * GET getMercenaryTacticalOperations
   */
  getMercenaryTacticalOperations(): Promise<(z.infer<typeof MercenaryTacticalOperationSchema>)[]> {
    return this.api.getMercenaryTacticalOperations() as Promise<(z.infer<typeof MercenaryTacticalOperationSchema>)[]>;
  }
}
