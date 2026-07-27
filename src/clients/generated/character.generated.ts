/* eslint-disable */
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { characterEndpoints } from '../../core/endpoints/characterEndpoints';
import { AgentResearchSchema, BlueprintSchema, CharacterInfoSchema, CharacterPortraitSchema, CharacterRoleSchema, CharacterTitleSchema, ContactNotificationSchema, CorporationHistorySchema, JumpFatigueSchema, MedalSchema, NotificationSchema, StandingSchema } from '../../schemas/character';

export class GeneratedCharacterClient extends BaseEsiClient<typeof characterEndpoints> {
  constructor(client: ApiClient) {
    super(client, characterEndpoints);
  }

  /**
   * GET getCharacterPublicInfo
   */
  getCharacterPublicInfo(characterId: number | string): Promise<z.infer<typeof CharacterInfoSchema>> {
    return this.api.getCharacterPublicInfo(characterId) as Promise<z.infer<typeof CharacterInfoSchema>>;
  }

  /**
   * GET getAgentsResearch
   * @requires Authentication
   */
  getAgentsResearch(characterId: number | string): Promise<(z.infer<typeof AgentResearchSchema>)[]> {
    return this.api.getAgentsResearch(characterId) as Promise<(z.infer<typeof AgentResearchSchema>)[]>;
  }

  /**
   * GET getBlueprints
   * @requires Authentication
   */
  getBlueprints(characterId: number | string): Promise<(z.infer<typeof BlueprintSchema>)[]> {
    return this.api.getBlueprints(characterId) as Promise<(z.infer<typeof BlueprintSchema>)[]>;
  }

  /**
   * GET getRoles
   * @requires Authentication
   */
  getRoles(characterId: number | string): Promise<z.infer<typeof CharacterRoleSchema>> {
    return this.api.getRoles(characterId) as Promise<z.infer<typeof CharacterRoleSchema>>;
  }

  /**
   * GET getStandings
   * @requires Authentication
   */
  getStandings(characterId: number | string): Promise<(z.infer<typeof StandingSchema>)[]> {
    return this.api.getStandings(characterId) as Promise<(z.infer<typeof StandingSchema>)[]>;
  }

  /**
   * GET getTitles
   * @requires Authentication
   */
  getTitles(characterId: number | string): Promise<(z.infer<typeof CharacterTitleSchema>)[]> {
    return this.api.getTitles(characterId) as Promise<(z.infer<typeof CharacterTitleSchema>)[]>;
  }

  /**
   * GET getContactNotifications
   * @requires Authentication
   */
  getContactNotifications(characterId: number | string): Promise<(z.infer<typeof ContactNotificationSchema>)[]> {
    return this.api.getContactNotifications(characterId) as Promise<(z.infer<typeof ContactNotificationSchema>)[]>;
  }

  /**
   * GET getCorporationHistory
   * @requires Authentication
   */
  getCorporationHistory(characterId: number | string): Promise<(z.infer<typeof CorporationHistorySchema>)[]> {
    return this.api.getCorporationHistory(characterId) as Promise<(z.infer<typeof CorporationHistorySchema>)[]>;
  }

  /**
   * GET getJumpFatigue
   * @requires Authentication
   */
  getJumpFatigue(characterId: number | string): Promise<z.infer<typeof JumpFatigueSchema>> {
    return this.api.getJumpFatigue(characterId) as Promise<z.infer<typeof JumpFatigueSchema>>;
  }

  /**
   * GET getMedals
   * @requires Authentication
   */
  getMedals(characterId: number | string): Promise<(z.infer<typeof MedalSchema>)[]> {
    return this.api.getMedals(characterId) as Promise<(z.infer<typeof MedalSchema>)[]>;
  }

  /**
   * GET getNotifications
   * @requires Authentication
   */
  getNotifications(characterId: number | string): Promise<(z.infer<typeof NotificationSchema>)[]> {
    return this.api.getNotifications(characterId) as Promise<(z.infer<typeof NotificationSchema>)[]>;
  }

  /**
   * GET getPortrait
   */
  getPortrait(characterId: number | string): Promise<z.infer<typeof CharacterPortraitSchema>> {
    return this.api.getPortrait(characterId) as Promise<z.infer<typeof CharacterPortraitSchema>>;
  }

  /**
   * POST postCharacterAffiliation
   */
  postCharacterAffiliation(...args: Parameters<(typeof this.api)['postCharacterAffiliation']>): Promise<unknown> {
    return this.api.postCharacterAffiliation(...args) as Promise<unknown>;
  }

  /**
   * POST calculateCspaChargeCost
   * @requires Authentication
   */
  calculateCspaChargeCost(...args: Parameters<(typeof this.api)['calculateCspaChargeCost']>): Promise<unknown> {
    return this.api.calculateCspaChargeCost(...args) as Promise<unknown>;
  }
}
