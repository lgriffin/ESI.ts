import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { corporationEndpoints } from '../core/endpoints/corporationEndpoints';
import {
  Blueprint,
  CorporationInfo,
  CorporationAllianceHistory,
  CorporationDivisions,
  CorporationFacility,
  CorporationIssuedMedal,
  CorporationMedal,
  CorporationMemberRole,
  CorporationMemberTitle,
  CorporationMemberTracking,
  CorporationRoleHistory,
  CorporationShareholder,
  CorporationStarbase,
  CorporationStarbaseDetail,
  CorporationStructure,
  CorporationTitle,
  ContainerLog,
  Standing,
} from '../types/api-responses';

export class CorporationsClient {
  private api: ReturnType<typeof createClient<typeof corporationEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<
    typeof createClient<typeof corporationEndpoints>
  >;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, corporationEndpoints);
  }

  /**
   * Retrieve public information about a corporation.
   *
   * @param corporationId - The ID of the corporation to look up
   * @returns Public corporation information including name, ticker, member count, and CEO
   */
  getCorporationInfo(corporationId: number): Promise<CorporationInfo> {
    return this.api.getCorporationInfo(
      corporationId,
    ) as Promise<CorporationInfo>;
  }

  /**
   * Retrieve the alliance membership history of a corporation.
   *
   * @param corporationId - The ID of the corporation whose alliance history to retrieve
   * @returns A chronological list of alliances the corporation has been a member of
   */
  getCorporationAllianceHistory(
    corporationId: number,
  ): Promise<CorporationAllianceHistory[]> {
    return this.api.getCorporationAllianceHistory(corporationId) as Promise<
      CorporationAllianceHistory[]
    >;
  }

  /**
   * Retrieve blueprints owned by a corporation.
   *
   * @param corporationId - The ID of the corporation whose blueprints to retrieve
   * @returns A list of blueprints with material/time efficiency and run information
   * @requires Authentication
   */
  getCorporationBlueprints(corporationId: number): Promise<Blueprint[]> {
    return this.api.getCorporationBlueprints(corporationId) as Promise<
      Blueprint[]
    >;
  }

  /**
   * Retrieve audit log secure container (ALSC) logs for a corporation.
   *
   * @param corporationId - The ID of the corporation whose container logs to retrieve
   * @returns A list of container access logs with action, character, and timestamp details
   * @requires Authentication
   */
  getCorporationAlscLogs(corporationId: number): Promise<ContainerLog[]> {
    return this.api.getCorporationAlscLogs(corporationId) as Promise<
      ContainerLog[]
    >;
  }

  /**
   * Retrieve the hangar and wallet division names for a corporation.
   *
   * @param corporationId - The ID of the corporation whose divisions to retrieve
   * @returns Hangar and wallet division configurations with custom names
   * @requires Authentication
   */
  getCorporationDivisions(
    corporationId: number,
  ): Promise<CorporationDivisions> {
    return this.api.getCorporationDivisions(
      corporationId,
    ) as Promise<CorporationDivisions>;
  }

  /**
   * Retrieve the industrial facilities owned by a corporation.
   *
   * @param corporationId - The ID of the corporation whose facilities to retrieve
   * @returns A list of corporation-owned facilities with type and solar system information
   * @requires Authentication
   */
  getCorporationFacilities(
    corporationId: number,
  ): Promise<CorporationFacility[]> {
    return this.api.getCorporationFacilities(corporationId) as Promise<
      CorporationFacility[]
    >;
  }

  /**
   * Retrieve icon URLs for a corporation at various resolutions.
   *
   * @param corporationId - The ID of the corporation whose icons to retrieve
   * @returns Icon URLs at 64x64, 128x128, and 256x256 resolutions
   */
  getCorporationIcon(
    corporationId: number,
  ): Promise<{ px64x64?: string; px128x128?: string; px256x256?: string }> {
    return this.api.getCorporationIcon(corporationId) as Promise<{
      px64x64?: string;
      px128x128?: string;
      px256x256?: string;
    }>;
  }

  /**
   * Retrieve medals created by a corporation.
   *
   * @param corporationId - The ID of the corporation whose medals to retrieve
   * @returns A list of medals defined by the corporation
   * @requires Authentication
   */
  getCorporationMedals(corporationId: number): Promise<CorporationMedal[]> {
    return this.api.getCorporationMedals(corporationId) as Promise<
      CorporationMedal[]
    >;
  }

  /**
   * Retrieve medals that have been issued to members by a corporation.
   *
   * @param corporationId - The ID of the corporation whose issued medals to retrieve
   * @returns A list of medals issued to corporation members with recipient and issuer details
   * @requires Authentication
   */
  getCorporationIssuedMedals(
    corporationId: number,
  ): Promise<CorporationIssuedMedal[]> {
    return this.api.getCorporationIssuedMedals(corporationId) as Promise<
      CorporationIssuedMedal[]
    >;
  }

  /**
   * Retrieve the character IDs of all members in a corporation.
   *
   * @param corporationId - The ID of the corporation whose members to retrieve
   * @returns An array of character IDs for all corporation members
   * @requires Authentication
   */
  getCorporationMembers(corporationId: number): Promise<number[]> {
    return this.api.getCorporationMembers(corporationId) as Promise<number[]>;
  }

  /**
   * Retrieve the maximum number of members a corporation can have based on its current skills.
   *
   * @param corporationId - The ID of the corporation whose member limit to retrieve
   * @returns The maximum member count for the corporation
   * @requires Authentication
   */
  getCorporationMemberLimit(corporationId: number): Promise<number> {
    return this.api.getCorporationMemberLimit(corporationId) as Promise<number>;
  }

  /**
   * Retrieve the titles assigned to each member of a corporation.
   *
   * @param corporationId - The ID of the corporation whose member titles to retrieve
   * @returns A list of members and their assigned title IDs
   * @requires Authentication
   */
  getCorporationMemberTitles(
    corporationId: number,
  ): Promise<CorporationMemberTitle[]> {
    return this.api.getCorporationMembersTitles(corporationId) as Promise<
      CorporationMemberTitle[]
    >;
  }

  /**
   * Retrieve tracking information for corporation members including last login and location.
   *
   * @param corporationId - The ID of the corporation whose member tracking data to retrieve
   * @returns A list of members with login times, ship types, and location details
   * @requires Authentication
   */
  getCorporationMemberTracking(
    corporationId: number,
  ): Promise<CorporationMemberTracking[]> {
    return this.api.getCorporationMemberTracking(corporationId) as Promise<
      CorporationMemberTracking[]
    >;
  }

  /**
   * Retrieve the roles assigned to each member of a corporation.
   *
   * @param corporationId - The ID of the corporation whose member roles to retrieve
   * @returns A list of members and their assigned roles across all role categories
   * @requires Authentication
   */
  getCorporationRoles(corporationId: number): Promise<CorporationMemberRole[]> {
    return this.api.getCorporationMemberRoles(corporationId) as Promise<
      CorporationMemberRole[]
    >;
  }

  /**
   * Retrieve the history of role changes for members of a corporation.
   *
   * @param corporationId - The ID of the corporation whose role change history to retrieve
   * @returns A chronological list of role changes with before/after states and issuer details
   * @requires Authentication
   */
  getCorporationRolesHistory(
    corporationId: number,
  ): Promise<CorporationRoleHistory[]> {
    return this.api.getCorporationMemberRolesHistory(corporationId) as Promise<
      CorporationRoleHistory[]
    >;
  }

  /**
   * Retrieve the shareholders of a corporation, including characters and corporations holding shares.
   *
   * @param corporationId - The ID of the corporation whose shareholders to retrieve
   * @returns A list of shareholders with share counts and holder types
   * @requires Authentication
   */
  getCorporationShareholders(
    corporationId: number,
  ): Promise<CorporationShareholder[]> {
    return this.api.getCorporationShareholders(corporationId) as Promise<
      CorporationShareholder[]
    >;
  }

  /**
   * Retrieve a corporation's standings with NPC factions, corporations, and agents.
   *
   * @param corporationId - The ID of the corporation whose standings to retrieve
   * @returns A list of standings with from_type, from_id, and standing value
   * @requires Authentication
   */
  getCorporationStandings(corporationId: number): Promise<Standing[]> {
    return this.api.getCorporationStandings(corporationId) as Promise<
      Standing[]
    >;
  }

  /**
   * Retrieve the list of starbases (POSes) owned by a corporation.
   *
   * @param corporationId - The ID of the corporation whose starbases to retrieve
   * @returns A list of starbases with type, system, and state information
   * @requires Authentication
   */
  getCorporationStarbases(
    corporationId: number,
  ): Promise<CorporationStarbase[]> {
    return this.api.getCorporationStarbases(corporationId) as Promise<
      CorporationStarbase[]
    >;
  }

  /**
   * Retrieve detailed configuration and fuel information for a specific starbase (POS).
   *
   * @param corporationId - The ID of the corporation that owns the starbase
   * @param starbaseId - The ID of the starbase to retrieve details for
   * @returns Detailed starbase information including fuel levels and access settings
   * @requires Authentication
   */
  getCorporationStarbaseDetail(
    corporationId: number,
    starbaseId: number,
  ): Promise<CorporationStarbaseDetail> {
    return this.api.getCorporationStarbaseDetail(
      corporationId,
      starbaseId,
    ) as Promise<CorporationStarbaseDetail>;
  }

  /**
   * Retrieve citadel and other upwell structures owned by a corporation.
   *
   * @param corporationId - The ID of the corporation whose structures to retrieve
   * @returns A list of structures with type, location, state, and service information
   * @requires Authentication
   */
  getCorporationStructures(
    corporationId: number,
  ): Promise<CorporationStructure[]> {
    return this.api.getCorporationStructures(corporationId) as Promise<
      CorporationStructure[]
    >;
  }

  /**
   * Retrieve the titles defined by a corporation and their associated roles.
   *
   * @param corporationId - The ID of the corporation whose titles to retrieve
   * @returns A list of corporation titles with names and granted roles
   * @requires Authentication
   */
  getCorporationTitles(corporationId: number): Promise<CorporationTitle[]> {
    return this.api.getCorporationTitles(corporationId) as Promise<
      CorporationTitle[]
    >;
  }

  /**
   * Retrieve a list of all NPC corporation IDs in EVE Online.
   *
   * @returns An array of NPC corporation IDs
   */
  getNpcCorporations(): Promise<number[]> {
    return this.api.getNpcCorporations() as Promise<number[]>;
  }

  withMetadata(): WithMetadata<Omit<CorporationsClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, corporationEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<CorporationsClient, 'withMetadata'>
    >;
  }
}
