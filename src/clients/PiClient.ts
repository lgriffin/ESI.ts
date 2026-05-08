import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { piEndpoints } from '../core/endpoints/piEndpoints';
import {
  PlanetaryColony,
  CustomsOffice,
  ColonyLayout,
  SchematicInfo,
} from '../types/api-responses';

export class PiClient extends BaseEsiClient<typeof piEndpoints> {
  constructor(client: ApiClient) {
    super(client, piEndpoints);
  }

  /**
   * Retrieves the list of planetary interaction colonies owned by a character.
   *
   * @param characterId - The ID of the character whose colonies to fetch
   * @returns A list of the character's planetary colonies
   * @requires Authentication
   */
  getColonies(characterId: number): Promise<PlanetaryColony[]> {
    return this.api.getColonies(characterId) as Promise<PlanetaryColony[]>;
  }

  /**
   * Retrieves the full layout of a planetary colony including pins, links, and routes.
   *
   * @param characterId - The ID of the character who owns the colony
   * @param planetId - The ID of the planet to get the colony layout for
   * @returns The colony layout with pins, links, and routes
   * @requires Authentication
   */
  getColonyLayout(
    characterId: number,
    planetId: number,
  ): Promise<ColonyLayout> {
    return this.api.getColonyLayout(
      characterId,
      planetId,
    ) as Promise<ColonyLayout>;
  }

  /**
   * Retrieves the list of customs offices owned by a corporation.
   *
   * @param corporationId - The ID of the corporation whose customs offices to fetch
   * @returns A list of the corporation's customs offices with their settings
   * @requires Authentication
   */
  getCorporationCustomsOffices(
    corporationId: number,
  ): Promise<CustomsOffice[]> {
    return this.api.getCorporationCustomsOffices(corporationId) as Promise<
      CustomsOffice[]
    >;
  }

  /**
   * Retrieves information about a planetary interaction schematic, including its inputs and outputs.
   *
   * @param schematicId - The ID of the schematic to look up
   * @returns The schematic details including cycle time, inputs, and outputs
   */
  getSchematicInformation(schematicId: number): Promise<SchematicInfo> {
    return this.api.getSchematicInformation(
      schematicId,
    ) as Promise<SchematicInfo>;
  }
}
