 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { sovereigntyEndpoints } from '../../core/endpoints/sovereigntyEndpoints';
import { SovereigntyCampaignSchema, SovereigntySystemSchema } from '../../schemas/sovereignty';

export class GeneratedSovereigntyClient extends BaseEsiClient<typeof sovereigntyEndpoints> {
  constructor(client: ApiClient) {
    super(client, sovereigntyEndpoints);
  }

  /**
   * GET getSovereigntyCampaigns
   */
  getSovereigntyCampaigns(): Promise<(z.infer<typeof SovereigntyCampaignSchema>)[]> {
    return this.api.getSovereigntyCampaigns() as Promise<(z.infer<typeof SovereigntyCampaignSchema>)[]>;
  }

  /**
   * GET getSovereigntySystems
   */
  getSovereigntySystems(): Promise<z.infer<typeof SovereigntySystemSchema>> {
    return this.api.getSovereigntySystems() as Promise<z.infer<typeof SovereigntySystemSchema>>;
  }
}
