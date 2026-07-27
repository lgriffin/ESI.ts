/* eslint-disable */
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { corporationEndpoints } from '../../core/endpoints/corporationEndpoints';
import { ContainerLogSchema, CorporationAllianceHistorySchema, CorporationDivisionsSchema, CorporationFacilitySchema, CorporationIconSchema, CorporationInfoSchema, CorporationIssuedMedalSchema, CorporationMedalSchema, CorporationMemberRoleSchema, CorporationMemberTitleSchema, CorporationMemberTrackingSchema, CorporationRoleHistorySchema, CorporationShareholderSchema, CorporationStandingSchema, CorporationStarbaseDetailSchema, CorporationStarbaseSchema, CorporationStructureSchema, CorporationTitleSchema } from '../../schemas/corporation';
import { BlueprintSchema } from '../../schemas/character';

export class GeneratedCorporationClient extends BaseEsiClient<typeof corporationEndpoints> {
  constructor(client: ApiClient) {
    super(client, corporationEndpoints);
  }

  /**
   * GET getCorporationInfo
   */
  getCorporationInfo(corporationId: number | string): Promise<z.infer<typeof CorporationInfoSchema>> {
    return this.api.getCorporationInfo(corporationId) as Promise<z.infer<typeof CorporationInfoSchema>>;
  }

  /**
   * GET getCorporationAllianceHistory
   */
  getCorporationAllianceHistory(corporationId: number | string): Promise<(z.infer<typeof CorporationAllianceHistorySchema>)[]> {
    return this.api.getCorporationAllianceHistory(corporationId) as Promise<(z.infer<typeof CorporationAllianceHistorySchema>)[]>;
  }

  /**
   * GET getCorporationBlueprints
   * @requires Authentication
   */
  getCorporationBlueprints(corporationId: number | string): Promise<(z.infer<typeof BlueprintSchema>)[]> {
    return this.api.getCorporationBlueprints(corporationId) as Promise<(z.infer<typeof BlueprintSchema>)[]>;
  }

  /**
   * GET getCorporationAlscLogs
   * @requires Authentication
   */
  getCorporationAlscLogs(corporationId: number | string): Promise<(z.infer<typeof ContainerLogSchema>)[]> {
    return this.api.getCorporationAlscLogs(corporationId) as Promise<(z.infer<typeof ContainerLogSchema>)[]>;
  }

  /**
   * GET getCorporationDivisions
   * @requires Authentication
   */
  getCorporationDivisions(corporationId: number | string): Promise<z.infer<typeof CorporationDivisionsSchema>> {
    return this.api.getCorporationDivisions(corporationId) as Promise<z.infer<typeof CorporationDivisionsSchema>>;
  }

  /**
   * GET getCorporationFacilities
   * @requires Authentication
   */
  getCorporationFacilities(corporationId: number | string): Promise<(z.infer<typeof CorporationFacilitySchema>)[]> {
    return this.api.getCorporationFacilities(corporationId) as Promise<(z.infer<typeof CorporationFacilitySchema>)[]>;
  }

  /**
   * GET getCorporationIcon
   */
  getCorporationIcon(corporationId: number | string): Promise<z.infer<typeof CorporationIconSchema>> {
    return this.api.getCorporationIcon(corporationId) as Promise<z.infer<typeof CorporationIconSchema>>;
  }

  /**
   * GET getCorporationMedals
   * @requires Authentication
   */
  getCorporationMedals(corporationId: number | string): Promise<(z.infer<typeof CorporationMedalSchema>)[]> {
    return this.api.getCorporationMedals(corporationId) as Promise<(z.infer<typeof CorporationMedalSchema>)[]>;
  }

  /**
   * GET getCorporationIssuedMedals
   * @requires Authentication
   */
  getCorporationIssuedMedals(corporationId: number | string): Promise<(z.infer<typeof CorporationIssuedMedalSchema>)[]> {
    return this.api.getCorporationIssuedMedals(corporationId) as Promise<(z.infer<typeof CorporationIssuedMedalSchema>)[]>;
  }

  /**
   * GET getCorporationMembers
   * @requires Authentication
   */
  getCorporationMembers(corporationId: number | string): Promise<number[]> {
    return this.api.getCorporationMembers(corporationId) as Promise<number[]>;
  }

  /**
   * GET getCorporationMemberLimit
   * @requires Authentication
   */
  getCorporationMemberLimit(corporationId: number | string): Promise<unknown> {
    return this.api.getCorporationMemberLimit(corporationId) as Promise<unknown>;
  }

  /**
   * GET getCorporationMembersTitles
   * @requires Authentication
   */
  getCorporationMembersTitles(corporationId: number | string): Promise<(z.infer<typeof CorporationMemberTitleSchema>)[]> {
    return this.api.getCorporationMembersTitles(corporationId) as Promise<(z.infer<typeof CorporationMemberTitleSchema>)[]>;
  }

  /**
   * GET getCorporationMemberTracking
   * @requires Authentication
   */
  getCorporationMemberTracking(corporationId: number | string): Promise<(z.infer<typeof CorporationMemberTrackingSchema>)[]> {
    return this.api.getCorporationMemberTracking(corporationId) as Promise<(z.infer<typeof CorporationMemberTrackingSchema>)[]>;
  }

  /**
   * GET getCorporationMemberRoles
   * @requires Authentication
   */
  getCorporationMemberRoles(corporationId: number | string): Promise<(z.infer<typeof CorporationMemberRoleSchema>)[]> {
    return this.api.getCorporationMemberRoles(corporationId) as Promise<(z.infer<typeof CorporationMemberRoleSchema>)[]>;
  }

  /**
   * GET getCorporationMemberRolesHistory
   * @requires Authentication
   */
  getCorporationMemberRolesHistory(corporationId: number | string): Promise<(z.infer<typeof CorporationRoleHistorySchema>)[]> {
    return this.api.getCorporationMemberRolesHistory(corporationId) as Promise<(z.infer<typeof CorporationRoleHistorySchema>)[]>;
  }

  /**
   * GET getCorporationShareholders
   * @requires Authentication
   */
  getCorporationShareholders(corporationId: number | string): Promise<(z.infer<typeof CorporationShareholderSchema>)[]> {
    return this.api.getCorporationShareholders(corporationId) as Promise<(z.infer<typeof CorporationShareholderSchema>)[]>;
  }

  /**
   * GET getCorporationStandings
   * @requires Authentication
   */
  getCorporationStandings(corporationId: number | string): Promise<(z.infer<typeof CorporationStandingSchema>)[]> {
    return this.api.getCorporationStandings(corporationId) as Promise<(z.infer<typeof CorporationStandingSchema>)[]>;
  }

  /**
   * GET getCorporationStarbases
   * @requires Authentication
   */
  getCorporationStarbases(corporationId: number | string): Promise<(z.infer<typeof CorporationStarbaseSchema>)[]> {
    return this.api.getCorporationStarbases(corporationId) as Promise<(z.infer<typeof CorporationStarbaseSchema>)[]>;
  }

  /**
   * GET getCorporationStarbaseDetail
   * @requires Authentication
   */
  getCorporationStarbaseDetail(corporationId: number | string, starbaseId: number | string): Promise<z.infer<typeof CorporationStarbaseDetailSchema>> {
    return this.api.getCorporationStarbaseDetail(corporationId, starbaseId) as Promise<z.infer<typeof CorporationStarbaseDetailSchema>>;
  }

  /**
   * GET getCorporationStructures
   * @requires Authentication
   */
  getCorporationStructures(corporationId: number | string): Promise<(z.infer<typeof CorporationStructureSchema>)[]> {
    return this.api.getCorporationStructures(corporationId) as Promise<(z.infer<typeof CorporationStructureSchema>)[]>;
  }

  /**
   * GET getCorporationTitles
   * @requires Authentication
   */
  getCorporationTitles(corporationId: number | string): Promise<(z.infer<typeof CorporationTitleSchema>)[]> {
    return this.api.getCorporationTitles(corporationId) as Promise<(z.infer<typeof CorporationTitleSchema>)[]>;
  }

  /**
   * GET getNpcCorporations
   */
  getNpcCorporations(): Promise<number[]> {
    return this.api.getNpcCorporations() as Promise<number[]>;
  }
}
