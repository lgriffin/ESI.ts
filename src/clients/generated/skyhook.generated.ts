 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { skyhookEndpoints } from '../../core/endpoints/skyhookEndpoints';
import { OrbitalSkyhookSchema, RaidableSkyhookSchema, SovereigntyHubSchema } from '../../schemas/skyhooks';

export class GeneratedSkyhookClient extends BaseEsiClient<typeof skyhookEndpoints> {
  constructor(client: ApiClient) {
    super(client, skyhookEndpoints);
  }

  /**
   * GET getSovereigntyHubs
   */
  getSovereigntyHubs(): Promise<(z.infer<typeof SovereigntyHubSchema>)[]> {
    return this.api.getSovereigntyHubs() as Promise<(z.infer<typeof SovereigntyHubSchema>)[]>;
  }

  /**
   * GET getOrbitalSkyhooks
   */
  getOrbitalSkyhooks(): Promise<(z.infer<typeof OrbitalSkyhookSchema>)[]> {
    return this.api.getOrbitalSkyhooks() as Promise<(z.infer<typeof OrbitalSkyhookSchema>)[]>;
  }

  /**
   * GET getRaidableSkyhooks
   */
  getRaidableSkyhooks(): Promise<(z.infer<typeof RaidableSkyhookSchema>)[]> {
    return this.api.getRaidableSkyhooks() as Promise<(z.infer<typeof RaidableSkyhookSchema>)[]>;
  }
}
