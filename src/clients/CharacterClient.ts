import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { characterEndpoints } from '../core/endpoints/characterEndpoints';
import {
  CharacterInfo,
  CharacterPortrait,
  AgentResearch,
  Blueprint,
  CorporationHistory,
  JumpFatigue,
  Medal,
  Notification,
  Standing,
  CharacterTitle,
  CharacterAffiliation,
  CharacterRole,
} from '../types/api-responses';

export class CharacterClient {
  private api: ReturnType<typeof createClient<typeof characterEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<typeof createClient<typeof characterEndpoints>>;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, characterEndpoints);
  }

  /**
   * Retrieve publicly available information about a character.
   *
   * @param characterId - The ID of the character to look up
   * @returns Public character information including name, corporation, and birthday
   */
  getCharacterPublicInfo(characterId: number): Promise<CharacterInfo> {
    return this.api.getCharacterPublicInfo(
      characterId,
    ) as Promise<CharacterInfo>;
  }

  /**
   * Retrieve a character's active research agents and their accumulated research points.
   *
   * @param characterId - The ID of the character whose research agents to retrieve
   * @returns A list of research agents with skill, points, and start date information
   * @requires Authentication
   */
  getCharacterAgentsResearch(characterId: number): Promise<AgentResearch[]> {
    return this.api.getAgentsResearch(characterId) as Promise<AgentResearch[]>;
  }

  /**
   * Retrieve blueprints owned by a character.
   *
   * @param characterId - The ID of the character whose blueprints to retrieve
   * @returns A list of blueprints with material/time efficiency and run information
   * @requires Authentication
   */
  getCharacterBlueprints(characterId: number): Promise<Blueprint[]> {
    return this.api.getBlueprints(characterId) as Promise<Blueprint[]>;
  }

  /**
   * Retrieve the corporation membership history of a character.
   *
   * @param characterId - The ID of the character whose corporation history to retrieve
   * @returns A chronological list of corporations the character has been a member of
   * @requires Authentication
   */
  getCharacterCorporationHistory(
    characterId: number,
  ): Promise<CorporationHistory[]> {
    return this.api.getCorporationHistory(characterId) as Promise<
      CorporationHistory[]
    >;
  }

  /**
   * Calculate the CSPA (CONCORD Spam Prevention Act) charge cost for sending mail to a set of characters.
   *
   * @param characterId - The ID of the character who would be sending mail
   * @param characters - An array of character IDs to calculate CSPA charges for
   * @returns The total CSPA charge cost in ISK
   * @requires Authentication
   */
  postCspaChargeCost(
    characterId: number,
    characters: number[],
  ): Promise<number> {
    return this.api.calculateCspaChargeCost(
      characterId,
      characters,
    ) as Promise<number>;
  }

  /**
   * Retrieve a character's current jump fatigue and activation cooldown timers.
   *
   * @param characterId - The ID of the character whose jump fatigue to retrieve
   * @returns Jump fatigue expiry dates and last jump information
   * @requires Authentication
   */
  getCharacterFatigue(characterId: number): Promise<JumpFatigue> {
    return this.api.getJumpFatigue(characterId) as Promise<JumpFatigue>;
  }

  /**
   * Retrieve medals awarded to a character.
   *
   * @param characterId - The ID of the character whose medals to retrieve
   * @returns A list of medals the character has been awarded
   * @requires Authentication
   */
  getCharacterMedals(characterId: number): Promise<Medal[]> {
    return this.api.getMedals(characterId) as Promise<Medal[]>;
  }

  /**
   * Retrieve a character's notifications from the notification center.
   *
   * @param characterId - The ID of the character whose notifications to retrieve
   * @returns A list of notifications including type, sender, and timestamp
   * @requires Authentication
   */
  getCharacterNotifications(characterId: number): Promise<Notification[]> {
    return this.api.getNotifications(characterId) as Promise<Notification[]>;
  }

  /**
   * Retrieve notifications related to contact changes for a character.
   *
   * @param characterId - The ID of the character whose contact notifications to retrieve
   * @returns A list of contact-related notifications
   * @requires Authentication
   */
  getCharacterNotificationsContacts(
    characterId: number,
  ): Promise<Notification[]> {
    return this.api.getContactNotifications(characterId) as Promise<
      Notification[]
    >;
  }

  /**
   * Retrieve portrait image URLs for a character at various resolutions.
   *
   * @param characterId - The ID of the character whose portrait to retrieve
   * @returns Portrait URLs at different resolutions (64x64, 128x128, 256x256, 512x512)
   */
  getCharacterPortrait(characterId: number): Promise<CharacterPortrait> {
    return this.api.getPortrait(characterId) as Promise<CharacterPortrait>;
  }

  /**
   * Retrieve the corporation roles assigned to a character.
   *
   * @param characterId - The ID of the character whose roles to retrieve
   * @returns The character's roles including regular, HQ, base, and other role categories
   * @requires Authentication
   */
  getCharacterRoles(characterId: number): Promise<CharacterRole> {
    return this.api.getRoles(characterId) as Promise<CharacterRole>;
  }

  /**
   * Retrieve a character's standings with NPC factions, corporations, and agents.
   *
   * @param characterId - The ID of the character whose standings to retrieve
   * @returns A list of standings with from_type, from_id, and standing value
   * @requires Authentication
   */
  getCharacterStandings(characterId: number): Promise<Standing[]> {
    return this.api.getStandings(characterId) as Promise<Standing[]>;
  }

  /**
   * Retrieve the corporation titles held by a character.
   *
   * @param characterId - The ID of the character whose titles to retrieve
   * @returns A list of corporation titles assigned to the character
   * @requires Authentication
   */
  getCharacterTitles(characterId: number): Promise<CharacterTitle[]> {
    return this.api.getTitles(characterId) as Promise<CharacterTitle[]>;
  }

  /**
   * Look up the current corporation, alliance, and faction affiliations for a set of characters via a bulk POST request.
   *
   * @param characters - An array of character IDs to look up affiliations for
   * @returns Affiliation data including corporation, alliance, and faction IDs for each character
   */
  postCharacterAffiliation(
    characters: number[],
  ): Promise<CharacterAffiliation[]> {
    return this.api.postCharacterAffiliation(characters) as Promise<
      CharacterAffiliation[]
    >;
  }

  withMetadata(): WithMetadata<Omit<CharacterClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, characterEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<CharacterClient, 'withMetadata'>
    >;
  }
}
