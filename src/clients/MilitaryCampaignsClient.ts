import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { militaryCampaignEndpoints } from '../core/endpoints/militaryCampaignEndpoints';
import {
  MilitaryCampaign,
  MilitaryCampaignsResponse,
  MilitaryCampaignObjective,
  MilitaryCampaignObjectivesResponse,
  CharacterMilitaryCampaignObjective,
  CharacterMilitaryCampaignObjectivesResponse,
} from '../types/api-responses';

export class MilitaryCampaignsClient extends BaseEsiClient<
  typeof militaryCampaignEndpoints
> {
  constructor(client: ApiClient) {
    super(client, militaryCampaignEndpoints);
  }

  /**
   * Retrieves a list of all active, completed, and expired military campaigns.
   *
   * @returns `{ campaigns }`, one entry per campaign
   */
  getMilitaryCampaigns(): Promise<MilitaryCampaignsResponse> {
    return this.api.getMilitaryCampaigns();
  }

  /**
   * Retrieves detailed information about a specific military campaign.
   *
   * @param campaignId - The UUID of the military campaign
   * @returns Detailed information about the campaign
   */
  getMilitaryCampaign(campaignId: string): Promise<MilitaryCampaign> {
    return this.api.getMilitaryCampaign(campaignId);
  }

  /**
   * Retrieves all objectives for a specific military campaign.
   *
   * @param campaignId - The UUID of the military campaign
   * @returns `{ objectives, cursor }` for the first page of the campaign's
   *   objectives
   */
  getMilitaryCampaignObjectives(
    campaignId: string,
  ): Promise<MilitaryCampaignObjectivesResponse> {
    return this.api.getMilitaryCampaignObjectives(campaignId);
  }

  /**
   * Retrieves detailed information about a specific objective in a military campaign.
   *
   * @param campaignId - The UUID of the military campaign
   * @param objectiveId - The UUID of the objective
   * @returns Detailed information about the objective
   */
  getMilitaryCampaignObjective(
    campaignId: string,
    objectiveId: string,
  ): Promise<MilitaryCampaignObjective> {
    return this.api.getMilitaryCampaignObjective(campaignId, objectiveId);
  }

  /**
   * Retrieves a character's participated objectives across military campaigns.
   *
   * @param characterId - The ID of the character
   * @returns `{ objectives, cursor }` for the first page of the character's
   *   campaign objective participations
   * @requires Authentication with scope esi.activity.char:read
   */
  getCharacterMilitaryCampaignObjectives(
    characterId: number,
  ): Promise<CharacterMilitaryCampaignObjectivesResponse> {
    return this.api.getCharacterMilitaryCampaignObjectives(characterId);
  }

  /**
   * Retrieves a character's participation details for a specific campaign objective.
   *
   * @param characterId - The ID of the character
   * @param objectiveId - The UUID of the objective
   * @returns The character's participation details for the objective
   * @requires Authentication with scope esi.activity.char:read
   */
  getCharacterMilitaryCampaignObjective(
    characterId: number,
    objectiveId: string,
  ): Promise<CharacterMilitaryCampaignObjective> {
    return this.api.getCharacterMilitaryCampaignObjective(
      characterId,
      objectiveId,
    );
  }
}
