import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { fleetEndpoints } from '../core/endpoints/fleetEndpoints';
import {
  CharacterFleetInfo,
  FleetInfo,
  FleetMember,
  FleetWing,
} from '../types/api-responses';

export class FleetClient {
  private api: ReturnType<typeof createClient<typeof fleetEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<typeof createClient<typeof fleetEndpoints>>;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, fleetEndpoints);
  }

  /**
   * Retrieves the fleet that a character is currently in, including their role and wing/squad assignment.
   *
   * @param characterId - The ID of the character
   * @returns Fleet membership information for the character
   * @requires Authentication
   */
  getCharacterFleetInfo(characterId: number): Promise<CharacterFleetInfo> {
    return this.api.getCharacterFleetInfo(
      characterId,
    ) as Promise<CharacterFleetInfo>;
  }

  /**
   * Retrieves detailed information about a fleet, including its MOTD and free-move setting.
   *
   * @param fleetId - The ID of the fleet
   * @returns Detailed fleet information
   * @requires Authentication
   */
  getFleetInformation(fleetId: number): Promise<FleetInfo> {
    return this.api.getFleetInfo(fleetId) as Promise<FleetInfo>;
  }

  /**
   * Updates fleet settings such as the MOTD and free-move toggle via PUT.
   *
   * @param fleetId - The ID of the fleet
   * @param body - The fleet settings to update
   * @requires Authentication
   */
  updateFleet(fleetId: number, body: object): Promise<void> {
    return this.api.updateFleet(fleetId, body) as Promise<void>;
  }

  /**
   * Retrieves all current members of a fleet, including their ship types and roles.
   *
   * @param fleetId - The ID of the fleet
   * @returns An array of fleet members
   * @requires Authentication
   */
  getFleetMembers(fleetId: number): Promise<FleetMember[]> {
    return this.api.getFleetMembers(fleetId) as Promise<FleetMember[]>;
  }

  /**
   * Sends an invitation to a character to join a fleet via POST.
   *
   * @param fleetId - The ID of the fleet
   * @param body - The invitation details including the character to invite and their role
   * @requires Authentication
   */
  createFleetInvitation(fleetId: number, body: object): Promise<void> {
    return this.api.createFleetInvitation(fleetId, body) as Promise<void>;
  }

  /**
   * Kicks a member from a fleet.
   *
   * @param fleetId - The ID of the fleet
   * @param memberId - The character ID of the member to kick
   * @requires Authentication
   */
  kickFleetMember(fleetId: number, memberId: number): Promise<void> {
    return this.api.kickFleetMember(fleetId, memberId) as Promise<void>;
  }

  /**
   * Moves a fleet member to a different wing, squad, or role via PUT.
   *
   * @param fleetId - The ID of the fleet
   * @param memberId - The character ID of the member to move
   * @param body - The target role, wing, and/or squad assignment
   * @requires Authentication
   */
  moveFleetMember(
    fleetId: number,
    memberId: number,
    body: object,
  ): Promise<void> {
    return this.api.moveFleetMember(fleetId, memberId, body) as Promise<void>;
  }

  /**
   * Deletes a squad from a fleet.
   *
   * @param fleetId - The ID of the fleet
   * @param squadId - The ID of the squad to delete
   * @requires Authentication
   */
  deleteFleetSquad(fleetId: number, squadId: number): Promise<void> {
    return this.api.deleteFleetSquad(fleetId, squadId) as Promise<void>;
  }

  /**
   * Renames a squad within a fleet via PUT.
   *
   * @param fleetId - The ID of the fleet
   * @param squadId - The ID of the squad to rename
   * @param name - The new name for the squad
   * @requires Authentication
   */
  renameFleetSquad(
    fleetId: number,
    squadId: number,
    name: string,
  ): Promise<void> {
    return this.api.renameFleetSquad(fleetId, squadId, name) as Promise<void>;
  }

  /**
   * Retrieves all wings and their squads for a fleet.
   *
   * @param fleetId - The ID of the fleet
   * @returns An array of fleet wings with their nested squads
   * @requires Authentication
   */
  getFleetWings(fleetId: number): Promise<FleetWing[]> {
    return this.api.getFleetWings(fleetId) as Promise<FleetWing[]>;
  }

  /**
   * Creates a new wing in a fleet via POST.
   *
   * @param fleetId - The ID of the fleet
   * @param body - The wing creation details
   * @returns The ID of the newly created wing
   * @requires Authentication
   */
  createFleetWing(fleetId: number, body: object): Promise<{ wing_id: number }> {
    return this.api.createFleetWing(fleetId, body) as Promise<{
      wing_id: number;
    }>;
  }

  /**
   * Deletes a wing from a fleet, along with all its squads.
   *
   * @param fleetId - The ID of the fleet
   * @param wingId - The ID of the wing to delete
   * @requires Authentication
   */
  deleteFleetWing(fleetId: number, wingId: number): Promise<void> {
    return this.api.deleteFleetWing(fleetId, wingId) as Promise<void>;
  }

  /**
   * Renames a wing within a fleet via PUT.
   *
   * @param fleetId - The ID of the fleet
   * @param wingId - The ID of the wing to rename
   * @param name - The new name for the wing
   * @requires Authentication
   */
  renameFleetWing(
    fleetId: number,
    wingId: number,
    name: string,
  ): Promise<void> {
    return this.api.renameFleetWing(fleetId, wingId, name) as Promise<void>;
  }

  /**
   * Creates a new squad under a wing in a fleet via POST.
   *
   * @param fleetId - The ID of the fleet
   * @param wingId - The ID of the wing to add the squad to
   * @returns The ID of the newly created squad
   * @requires Authentication
   */
  createFleetSquad(
    fleetId: number,
    wingId: number,
  ): Promise<{ squad_id: number }> {
    return this.api.createFleetSquad(fleetId, wingId) as Promise<{
      squad_id: number;
    }>;
  }

  withMetadata(): WithMetadata<Omit<FleetClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, fleetEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<FleetClient, 'withMetadata'>
    >;
  }
}
