import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { piEndpoints } from '../core/endpoints/piEndpoints';
import {
  PlanetaryColony,
  CustomsOffice,
  ColonyLayout,
  SchematicInfo,
} from '../types/api-responses';

export class PiClient {
  private api: ReturnType<typeof createClient<typeof piEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<typeof createClient<typeof piEndpoints>>;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, piEndpoints);
  }

  /**
   * Retrieves the list of planetary interaction colonies owned by a character.
   *
   * @param characterId - The ID of the character whose colonies to fetch
   * @returns A list of the character's planetary colonies
   * @requires Authentication
   */
  async getColonies(characterId: number): Promise<PlanetaryColony[]> {
    return this.api.getColonies(characterId);
  }

  /**
   * Retrieves the full layout of a planetary colony including pins, links, and routes.
   *
   * @param characterId - The ID of the character who owns the colony
   * @param planetId - The ID of the planet to get the colony layout for
   * @returns The colony layout with pins, links, and routes
   * @requires Authentication
   */
  async getColonyLayout(
    characterId: number,
    planetId: number,
  ): Promise<ColonyLayout> {
    return this.api.getColonyLayout(characterId, planetId);
  }

  /**
   * Retrieves the list of customs offices owned by a corporation.
   *
   * @param corporationId - The ID of the corporation whose customs offices to fetch
   * @returns A list of the corporation's customs offices with their settings
   * @requires Authentication
   */
  async getCorporationCustomsOffices(
    corporationId: number,
  ): Promise<CustomsOffice[]> {
    return this.api.getCorporationCustomsOffices(corporationId);
  }

  /**
   * Retrieves information about a planetary interaction schematic, including its inputs and outputs.
   *
   * @param schematicId - The ID of the schematic to look up
   * @returns The schematic details including cycle time, inputs, and outputs
   */
  async getSchematicInformation(schematicId: number): Promise<SchematicInfo> {
    return this.api.getSchematicInformation(schematicId);
  }

  withMetadata(): WithMetadata<Omit<PiClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, piEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<PiClient, 'withMetadata'>
    >;
  }
}
