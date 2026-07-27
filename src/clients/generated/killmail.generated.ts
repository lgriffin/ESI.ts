 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { killmailEndpoints } from '../../core/endpoints/killmailEndpoints';
import { KillmailSchema, KillmailSummarySchema } from '../../schemas/killmails';

export class GeneratedKillmailClient extends BaseEsiClient<typeof killmailEndpoints> {
  constructor(client: ApiClient) {
    super(client, killmailEndpoints);
  }

  /**
   * GET getCharacterRecentKillmails
   * @requires Authentication
   */
  getCharacterRecentKillmails(characterId: number | string): Promise<(z.infer<typeof KillmailSummarySchema>)[]> {
    return this.api.getCharacterRecentKillmails(characterId) as Promise<(z.infer<typeof KillmailSummarySchema>)[]>;
  }

  /**
   * GET getCorporationRecentKillmails
   * @requires Authentication
   */
  getCorporationRecentKillmails(corporationId: number | string): Promise<(z.infer<typeof KillmailSummarySchema>)[]> {
    return this.api.getCorporationRecentKillmails(corporationId) as Promise<(z.infer<typeof KillmailSummarySchema>)[]>;
  }

  /**
   * GET getKillmail
   */
  getKillmail(killmailId: number | string, killmailHash: number | string): Promise<z.infer<typeof KillmailSchema>> {
    return this.api.getKillmail(killmailId, killmailHash) as Promise<z.infer<typeof KillmailSchema>>;
  }
}
