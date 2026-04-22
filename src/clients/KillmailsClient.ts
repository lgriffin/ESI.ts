import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { killmailEndpoints } from '../core/endpoints/killmailEndpoints';
import { KillmailSummary, Killmail } from '../types/api-responses';

export class KillmailsClient {
  private api: ReturnType<typeof createClient<typeof killmailEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<typeof createClient<typeof killmailEndpoints>>;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, killmailEndpoints);
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

  withMetadata(): WithMetadata<Omit<KillmailsClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, killmailEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<KillmailsClient, 'withMetadata'>
    >;
  }
}
