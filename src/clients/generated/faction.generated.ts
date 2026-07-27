 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { factionEndpoints } from '../../core/endpoints/factionEndpoints';
import { FactionWarfareCharacterStatsSchema, FactionWarfareCorporationStatsSchema, FactionWarfareLeaderboardSchema, FactionWarfareStatsSchema, FactionWarfareSystemSchema, FactionWarfareWarSchema } from '../../schemas/faction-warfare';

export class GeneratedFactionClient extends BaseEsiClient<typeof factionEndpoints> {
  constructor(client: ApiClient) {
    super(client, factionEndpoints);
  }

  /**
   * GET getCharacterStats
   * @requires Authentication
   */
  getCharacterStats(characterId: number | string): Promise<z.infer<typeof FactionWarfareCharacterStatsSchema>> {
    return this.api.getCharacterStats(characterId) as Promise<z.infer<typeof FactionWarfareCharacterStatsSchema>>;
  }

  /**
   * GET getCorporationStats
   * @requires Authentication
   */
  getCorporationStats(corporationId: number | string): Promise<z.infer<typeof FactionWarfareCorporationStatsSchema>> {
    return this.api.getCorporationStats(corporationId) as Promise<z.infer<typeof FactionWarfareCorporationStatsSchema>>;
  }

  /**
   * GET getOverall
   */
  getOverall(): Promise<z.infer<typeof FactionWarfareLeaderboardSchema>> {
    return this.api.getOverall() as Promise<z.infer<typeof FactionWarfareLeaderboardSchema>>;
  }

  /**
   * GET getCharacters
   */
  getCharacters(): Promise<z.infer<typeof FactionWarfareLeaderboardSchema>> {
    return this.api.getCharacters() as Promise<z.infer<typeof FactionWarfareLeaderboardSchema>>;
  }

  /**
   * GET getCorporations
   */
  getCorporations(): Promise<z.infer<typeof FactionWarfareLeaderboardSchema>> {
    return this.api.getCorporations() as Promise<z.infer<typeof FactionWarfareLeaderboardSchema>>;
  }

  /**
   * GET getStats
   */
  getStats(): Promise<(z.infer<typeof FactionWarfareStatsSchema>)[]> {
    return this.api.getStats() as Promise<(z.infer<typeof FactionWarfareStatsSchema>)[]>;
  }

  /**
   * GET getSystems
   */
  getSystems(): Promise<(z.infer<typeof FactionWarfareSystemSchema>)[]> {
    return this.api.getSystems() as Promise<(z.infer<typeof FactionWarfareSystemSchema>)[]>;
  }

  /**
   * GET getWars
   */
  getWars(): Promise<(z.infer<typeof FactionWarfareWarSchema>)[]> {
    return this.api.getWars() as Promise<(z.infer<typeof FactionWarfareWarSchema>)[]>;
  }
}
