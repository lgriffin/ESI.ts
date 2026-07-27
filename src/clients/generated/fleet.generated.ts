/* eslint-disable */
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { fleetEndpoints } from '../../core/endpoints/fleetEndpoints';
import { CharacterFleetInfoSchema, FleetInfoSchema, FleetMemberSchema, FleetWingSchema } from '../../schemas/fleet';

export class GeneratedFleetClient extends BaseEsiClient<typeof fleetEndpoints> {
  constructor(client: ApiClient) {
    super(client, fleetEndpoints);
  }

  /**
   * GET getCharacterFleetInfo
   * @requires Authentication
   */
  getCharacterFleetInfo(characterId: number | string): Promise<z.infer<typeof CharacterFleetInfoSchema>> {
    return this.api.getCharacterFleetInfo(characterId) as Promise<z.infer<typeof CharacterFleetInfoSchema>>;
  }

  /**
   * GET getFleetInfo
   * @requires Authentication
   */
  getFleetInfo(fleetId: number | string): Promise<z.infer<typeof FleetInfoSchema>> {
    return this.api.getFleetInfo(fleetId) as Promise<z.infer<typeof FleetInfoSchema>>;
  }

  /**
   * PUT updateFleet
   * @requires Authentication
   */
  updateFleet(...args: Parameters<(typeof this.api)['updateFleet']>): Promise<unknown> {
    return this.api.updateFleet(...args) as Promise<unknown>;
  }

  /**
   * GET getFleetMembers
   * @requires Authentication
   */
  getFleetMembers(fleetId: number | string): Promise<(z.infer<typeof FleetMemberSchema>)[]> {
    return this.api.getFleetMembers(fleetId) as Promise<(z.infer<typeof FleetMemberSchema>)[]>;
  }

  /**
   * POST createFleetInvitation
   * @requires Authentication
   */
  createFleetInvitation(...args: Parameters<(typeof this.api)['createFleetInvitation']>): Promise<unknown> {
    return this.api.createFleetInvitation(...args) as Promise<unknown>;
  }

  /**
   * DELETE kickFleetMember
   * @requires Authentication
   */
  kickFleetMember(fleetId: number | string, memberId: number | string): Promise<unknown> {
    return this.api.kickFleetMember(fleetId, memberId) as Promise<unknown>;
  }

  /**
   * PUT moveFleetMember
   * @requires Authentication
   */
  moveFleetMember(...args: Parameters<(typeof this.api)['moveFleetMember']>): Promise<unknown> {
    return this.api.moveFleetMember(...args) as Promise<unknown>;
  }

  /**
   * DELETE deleteFleetSquad
   * @requires Authentication
   */
  deleteFleetSquad(fleetId: number | string, squadId: number | string): Promise<unknown> {
    return this.api.deleteFleetSquad(fleetId, squadId) as Promise<unknown>;
  }

  /**
   * PUT renameFleetSquad
   * @requires Authentication
   */
  renameFleetSquad(...args: Parameters<(typeof this.api)['renameFleetSquad']>): Promise<unknown> {
    return this.api.renameFleetSquad(...args) as Promise<unknown>;
  }

  /**
   * GET getFleetWings
   * @requires Authentication
   */
  getFleetWings(fleetId: number | string): Promise<(z.infer<typeof FleetWingSchema>)[]> {
    return this.api.getFleetWings(fleetId) as Promise<(z.infer<typeof FleetWingSchema>)[]>;
  }

  /**
   * POST createFleetWing
   * @requires Authentication
   */
  createFleetWing(...args: Parameters<(typeof this.api)['createFleetWing']>): Promise<unknown> {
    return this.api.createFleetWing(...args) as Promise<unknown>;
  }

  /**
   * DELETE deleteFleetWing
   * @requires Authentication
   */
  deleteFleetWing(fleetId: number | string, wingId: number | string): Promise<unknown> {
    return this.api.deleteFleetWing(fleetId, wingId) as Promise<unknown>;
  }

  /**
   * PUT renameFleetWing
   * @requires Authentication
   */
  renameFleetWing(...args: Parameters<(typeof this.api)['renameFleetWing']>): Promise<unknown> {
    return this.api.renameFleetWing(...args) as Promise<unknown>;
  }

  /**
   * POST createFleetSquad
   * @requires Authentication
   */
  createFleetSquad(fleetId: number | string, wingId: number | string): Promise<unknown> {
    return this.api.createFleetSquad(fleetId, wingId) as Promise<unknown>;
  }
}
