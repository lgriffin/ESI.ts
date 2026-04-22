import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { universeEndpoints } from '../core/endpoints/universeEndpoints';
import {
  Ancestry,
  AsteroidBeltInfo,
  Bloodline,
  BulkIdResult,
  ConstellationInfo,
  Faction,
  GraphicInfo,
  ItemCategory,
  ItemGroup,
  MoonInfo,
  NameAndCategory,
  PlanetInfo,
  Race,
  RegionInfo,
  SchematicInfo,
  SolarSystemInfo,
  StarInfo,
  StargateInfo,
  StationInfo,
  StructureInfo,
  SystemJump,
  SystemKill,
  TypeInfo,
} from '../types/api-responses';

export class UniverseClient {
  private api: ReturnType<typeof createClient<typeof universeEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<typeof createClient<typeof universeEndpoints>>;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, universeEndpoints);
  }

  /**
   * Retrieves all available character ancestries for character creation.
   *
   * @returns A list of character ancestries
   */
  async getAncestries(): Promise<Ancestry[]> {
    return this.api.getAncestries();
  }

  /**
   * Retrieves information about an asteroid belt, including its position in space.
   *
   * @param asteroidBeltId - The ID of the asteroid belt
   * @returns Details about the asteroid belt
   */
  async getAsteroidBeltInfo(asteroidBeltId: number): Promise<AsteroidBeltInfo> {
    return this.api.getAsteroidBeltInfo(asteroidBeltId);
  }

  /**
   * Retrieves all available character bloodlines for character creation.
   *
   * @returns A list of character bloodlines
   */
  async getBloodlines(): Promise<Bloodline[]> {
    return this.api.getBloodlines();
  }

  /**
   * Retrieves information about a constellation, including its systems and position.
   *
   * @param constellationId - The ID of the constellation
   * @returns Detailed constellation information
   */
  async getConstellationById(
    constellationId: number,
  ): Promise<ConstellationInfo> {
    return this.api.getConstellationById(constellationId);
  }

  /**
   * Retrieves a list of all constellation IDs in the EVE universe.
   *
   * @returns A list of constellation IDs
   */
  async getConstellations(): Promise<number[]> {
    return this.api.getConstellations();
  }

  /**
   * Retrieves all NPC factions in the EVE universe.
   *
   * @returns A list of NPC factions
   */
  async getFactions(): Promise<Faction[]> {
    return this.api.getFactions();
  }

  /**
   * Retrieves information about a specific graphic asset used in the EVE client.
   *
   * @param graphicId - The ID of the graphic
   * @returns Detailed graphic information
   */
  async getGraphicById(graphicId: number): Promise<GraphicInfo> {
    return this.api.getGraphicById(graphicId);
  }

  /**
   * Retrieves a list of all graphic asset IDs.
   *
   * @returns A list of graphic IDs
   */
  async getGraphics(): Promise<number[]> {
    return this.api.getGraphics();
  }

  /**
   * Retrieves a list of all item category IDs in the EVE universe.
   *
   * @returns A list of item category IDs
   */
  async getItemCategories(): Promise<number[]> {
    return this.api.getCategories();
  }

  /**
   * Retrieves information about a specific item category, including its groups.
   *
   * @param categoryId - The ID of the item category
   * @returns Detailed item category information
   */
  async getItemCategoryById(categoryId: number): Promise<ItemCategory> {
    return this.api.getCategoryById(categoryId);
  }

  /**
   * Retrieves information about a specific item group, including its types.
   *
   * @param groupId - The ID of the item group
   * @returns Detailed item group information
   */
  async getItemGroupById(groupId: number): Promise<ItemGroup> {
    return this.api.getItemGroupById(groupId);
  }

  /**
   * Retrieves a list of all item group IDs in the EVE universe.
   *
   * @returns A list of item group IDs
   */
  async getItemGroups(): Promise<number[]> {
    return this.api.getItemGroups();
  }

  /**
   * Retrieves information about a moon, including its name and position.
   *
   * @param moonId - The ID of the moon
   * @returns Detailed moon information
   */
  async getMoonById(moonId: number): Promise<MoonInfo> {
    return this.api.getMoonById(moonId);
  }

  /**
   * Retrieves information about a planet, including its name, type, and position.
   *
   * @param planetId - The ID of the planet
   * @returns Detailed planet information
   */
  async getPlanetById(planetId: number): Promise<PlanetInfo> {
    return this.api.getPlanetById(planetId);
  }

  /**
   * Retrieves all playable races in the EVE universe.
   *
   * @returns A list of playable races
   */
  async getRaces(): Promise<Race[]> {
    return this.api.getRaces();
  }

  /**
   * Retrieves information about a region, including its constellations and name.
   *
   * @param regionId - The ID of the region
   * @returns Detailed region information
   */
  async getRegionById(regionId: number): Promise<RegionInfo> {
    return this.api.getRegionById(regionId);
  }

  /**
   * Retrieves information about a star, including its spectral class and luminosity.
   *
   * @param starId - The ID of the star
   * @returns Detailed star information
   */
  async getStarById(starId: number): Promise<StarInfo> {
    return this.api.getStarById(starId);
  }

  /**
   * Retrieves information about a stargate, including its destination and position.
   *
   * @param stargateId - The ID of the stargate
   * @returns Detailed stargate information
   */
  async getStargateById(stargateId: number): Promise<StargateInfo> {
    return this.api.getStargateById(stargateId);
  }

  /**
   * Retrieves public information about a station, including its services and location.
   *
   * @param stationId - The ID of the station
   * @returns Detailed station information
   */
  async getStationById(stationId: number): Promise<StationInfo> {
    return this.api.getStationById(stationId);
  }

  /**
   * Retrieves information about a player-owned structure by its ID.
   *
   * @param structureId - The ID of the structure
   * @returns Detailed structure information
   * @requires Authentication
   */
  async getStructureById(structureId: number): Promise<StructureInfo> {
    return this.api.getStructureById(structureId);
  }

  /**
   * Retrieves a list of all publicly visible player-owned structure IDs.
   *
   * @returns A list of structure IDs
   */
  async getStructures(): Promise<number[]> {
    return this.api.getStructures();
  }

  /**
   * Retrieves information about a solar system, including its planets, stargates, and security status.
   *
   * @param systemId - The ID of the solar system
   * @returns Detailed solar system information
   */
  async getSystemById(systemId: number): Promise<SolarSystemInfo> {
    return this.api.getSystemById(systemId);
  }

  /**
   * Retrieves the number of ship jumps per solar system within the last hour.
   *
   * @returns A list of solar systems with their jump counts
   */
  async getSystemJumps(): Promise<SystemJump[]> {
    return this.api.getSystemJumps();
  }

  /**
   * Retrieves the number of NPC and player ship kills per solar system within the last hour.
   *
   * @returns A list of solar systems with their kill counts
   */
  async getSystemKills(): Promise<SystemKill[]> {
    return this.api.getSystemKills();
  }

  /**
   * Retrieves a list of all solar system IDs in the EVE universe.
   *
   * @returns A list of solar system IDs
   */
  async getSystems(): Promise<number[]> {
    return this.api.getSystems();
  }

  /**
   * Retrieves information about a specific item type, including its description and attributes.
   *
   * @param typeId - The ID of the item type
   * @returns Detailed item type information
   */
  async getTypeById(typeId: number): Promise<TypeInfo> {
    return this.api.getTypeById(typeId);
  }

  /**
   * Retrieves a list of all item type IDs in the EVE universe.
   *
   * @returns A list of item type IDs
   */
  async getTypes(): Promise<number[]> {
    return this.api.getTypes();
  }

  /**
   * Resolves a list of names to their corresponding IDs via a bulk POST operation.
   *
   * @param ids - An array of names to resolve to IDs
   * @returns The resolved IDs grouped by entity category
   */
  async postBulkNamesToIds(ids: number[]): Promise<BulkIdResult> {
    return this.api.postBulkNamesToIds(ids);
  }

  /**
   * Resolves a list of IDs to their names and categories via a bulk POST operation.
   *
   * @param ids - An array of entity IDs to resolve
   * @returns A list of names with their corresponding categories
   */
  async postNamesAndCategories(ids: number[]): Promise<NameAndCategory[]> {
    return this.api.postNamesAndCategories(ids);
  }

  /**
   * Retrieves information about a planetary interaction schematic.
   *
   * @param schematicId - The ID of the PI schematic
   * @returns Detailed schematic information including inputs and outputs
   */
  async getSchematicById(schematicId: number): Promise<SchematicInfo> {
    return this.api.getSchematicById(schematicId);
  }

  /**
   * Retrieves a list of all region IDs in the EVE universe.
   *
   * @returns A list of region IDs
   */
  async getRegions(): Promise<number[]> {
    return this.api.getRegions();
  }

  withMetadata(): WithMetadata<Omit<UniverseClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, universeEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<UniverseClient, 'withMetadata'>
    >;
  }
}
