 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { warEndpoints } from '../../core/endpoints/warEndpoints';
import { WarSchema } from '../../schemas/wars';
import { KillmailSummarySchema } from '../../schemas/killmails';

export class GeneratedWarClient extends BaseEsiClient<typeof warEndpoints> {
  constructor(client: ApiClient) {
    super(client, warEndpoints);
  }

  /**
   * GET getWars
   */
  getWars(): Promise<number[]> {
    return this.api.getWars() as Promise<number[]>;
  }

  /**
   * GET getWarById
   */
  getWarById(warId: number | string): Promise<z.infer<typeof WarSchema>> {
    return this.api.getWarById(warId) as Promise<z.infer<typeof WarSchema>>;
  }

  /**
   * GET getWarKillmails
   */
  getWarKillmails(warId: number | string): Promise<(z.infer<typeof KillmailSummarySchema>)[]> {
    return this.api.getWarKillmails(warId) as Promise<(z.infer<typeof KillmailSummarySchema>)[]>;
  }
}
