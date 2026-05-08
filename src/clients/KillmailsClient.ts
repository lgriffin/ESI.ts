import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { killmailEndpoints } from '../core/endpoints/killmailEndpoints';
import { KillmailSummary, Killmail } from '../types/api-responses';

export class KillmailsClient extends BaseEsiClient<typeof killmailEndpoints> {
  constructor(client: ApiClient) {
    super(client, killmailEndpoints);
  }

  /**
   * Retrieves a list of recent killmail summaries for a character.
   *
   * @param characterId - The ID of the character to fetch killmails for
   * @returns A list of recent killmail summaries including killmail IDs and hashes
   * @requires Authentication
   */
  getCharacterRecentKillmails(characterId: number): Promise<KillmailSummary[]> {
    return this.api.getCharacterRecentKillmails(characterId) as Promise<
      KillmailSummary[]
    >;
  }

  /**
   * Retrieves a list of recent killmail summaries for a corporation.
   *
   * @param corporationId - The ID of the corporation to fetch killmails for
   * @returns A list of recent killmail summaries including killmail IDs and hashes
   * @requires Authentication
   */
  getCorporationRecentKillmails(
    corporationId: number,
  ): Promise<KillmailSummary[]> {
    return this.api.getCorporationRecentKillmails(corporationId) as Promise<
      KillmailSummary[]
    >;
  }

  /**
   * Retrieves the full details of a specific killmail by its ID and hash.
   *
   * @param killmailId - The ID of the killmail to retrieve
   * @param killmailHash - The hash of the killmail for verification
   * @returns The full killmail details including victim, attackers, and items
   */
  getKillmail(killmailId: number, killmailHash: string): Promise<Killmail> {
    return this.api.getKillmail(killmailId, killmailHash) as Promise<Killmail>;
  }
}
