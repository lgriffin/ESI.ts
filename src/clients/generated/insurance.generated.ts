 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { insuranceEndpoints } from '../../core/endpoints/insuranceEndpoints';
import { InsurancePriceSchema } from '../../schemas/insurance';

export class GeneratedInsuranceClient extends BaseEsiClient<typeof insuranceEndpoints> {
  constructor(client: ApiClient) {
    super(client, insuranceEndpoints);
  }

  /**
   * GET getInsurancePrices
   */
  getInsurancePrices(): Promise<(z.infer<typeof InsurancePriceSchema>)[]> {
    return this.api.getInsurancePrices() as Promise<(z.infer<typeof InsurancePriceSchema>)[]>;
  }
}
