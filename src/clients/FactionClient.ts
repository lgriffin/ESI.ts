import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { factionEndpoints } from '../core/endpoints/factionEndpoints';
import {
  FactionWarfareStats,
  FactionWarfareCharacterStats,
  FactionWarfareCorporationStats,
  FactionWarfareLeaderboard,
  FactionWarfareSystem,
  FactionWarfareWar,
} from '../types/api-responses';

export class FactionClient {
  private api: ReturnType<typeof createClient<typeof factionEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<typeof createClient<typeof factionEndpoints>>;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, factionEndpoints);
  }

  /**
   * Retrieves the top characters in faction warfare leaderboards.
   *
   * @returns Faction warfare character leaderboard rankings
   */
  async getLeaderboardsCharacters(): Promise<FactionWarfareLeaderboard> {
    return this.api.getCharacters();
  }

  /**
   * Retrieves the top corporations in faction warfare leaderboards.
   *
   * @returns Faction warfare corporation leaderboard rankings
   */
  async getLeaderboardsCorporations(): Promise<FactionWarfareLeaderboard> {
    return this.api.getCorporations();
  }

  /**
   * Retrieves the overall faction warfare leaderboards across all factions.
   *
   * @returns Overall faction warfare leaderboard rankings
   */
  async getLeaderboardsOverall(): Promise<FactionWarfareLeaderboard> {
    return this.api.getOverall();
  }

  /**
   * Retrieves faction warfare statistics for all factions, including kill and victory point totals.
   *
   * @returns An array of per-faction warfare statistics
   */
  async getStats(): Promise<FactionWarfareStats[]> {
    return this.api.getStats();
  }

  /**
   * Retrieves faction warfare statistics for a specific character, including enlistment info and kill counts.
   *
   * @param characterId - The ID of the character
   * @returns Faction warfare statistics for the character
   * @requires Authentication
   */
  async getCharacterStats(
    characterId: number,
  ): Promise<FactionWarfareCharacterStats> {
    return this.api.getCharacterStats(characterId);
  }

  /**
   * Retrieves faction warfare statistics for a specific corporation, including kill counts and victory points.
   *
   * @param corporationId - The ID of the corporation
   * @returns Faction warfare statistics for the corporation
   * @requires Authentication
   */
  async getCorporationStats(
    corporationId: number,
  ): Promise<FactionWarfareCorporationStats> {
    return this.api.getCorporationStats(corporationId);
  }

  /**
   * Retrieves the current ownership and contested status of all faction warfare systems.
   *
   * @returns An array of faction warfare system statuses
   */
  async getSystems(): Promise<FactionWarfareSystem[]> {
    return this.api.getSystems();
  }

  /**
   * Retrieves the list of active faction warfare wars, showing which factions are fighting each other.
   *
   * @returns An array of active faction warfare wars
   */
  async getWars(): Promise<FactionWarfareWar[]> {
    return this.api.getWars();
  }

  withMetadata(): WithMetadata<Omit<FactionClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, factionEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<FactionClient, 'withMetadata'>
    >;
  }
}
