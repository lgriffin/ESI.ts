import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { warEndpoints } from '../core/endpoints/warEndpoints';
import { War, KillmailSummary } from '../types/api-responses';

export class WarsClient extends BaseEsiClient<typeof warEndpoints> {
  constructor(client: ApiClient) {
    super(client, warEndpoints);
  }

  /**
   * Retrieves a list of all war IDs, ordered by war ID descending.
   *
   * @returns A list of war IDs
   */
  getWars(): Promise<number[]> {
    return this.api.getWars() as Promise<number[]>;
  }

  /**
   * Retrieves detailed information about a specific war, including aggressors, defenders, and status.
   *
   * @param warId - The ID of the war
   * @returns Detailed war information
   */
  getWarById(warId: number): Promise<War> {
    return this.api.getWarById(warId) as Promise<War>;
  }

  /**
   * Retrieves the killmail summaries associated with a specific war.
   *
   * @param warId - The ID of the war
   * @returns A list of killmail summaries for the war
   */
  getWarKillmails(warId: number): Promise<KillmailSummary[]> {
    return this.api.getWarKillmails(warId) as Promise<KillmailSummary[]>;
  }
}
