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
  getAncestries(): Promise<Ancestry[]> {
    return this.api.getAncestries() as Promise<Ancestry[]>;
  }

  /**
   * Retrieves information about an asteroid belt, including its position in space.
   *
   * @param asteroidBeltId - The ID of the asteroid belt
   * @returns Details about the asteroid belt
   */
  getAsteroidBeltInfo(asteroidBeltId: number): Promise<AsteroidBeltInfo> {
    return this.api.getAsteroidBeltInfo(
      asteroidBeltId,
    ) as Promise<AsteroidBeltInfo>;
  }

  /**
   * Retrieves all available character bloodlines for character creation.
   *
   * @returns A list of character bloodlines
   */
  getBloodlines(): Promise<Bloodline[]> {
    return this.api.getBloodlines() as Promise<Bloodline[]>;
  }

  /**
   * Retrieves information about a constellation, including its systems and position.
   *
   * @param constellationId - The ID of the constellation
   * @returns Detailed constellation information
   */
  getConstellationById(constellationId: number): Promise<ConstellationInfo> {
    return this.api.getConstellationById(
      constellationId,
    ) as Promise<ConstellationInfo>;
  }

  /**
   * Retrieves a list of all constellation IDs in the EVE universe.
   *
   * @returns A list of constellation IDs
   */
  getConstellations(): Promise<number[]> {
    return this.api.getConstellations() as Promise<number[]>;
  }

  /**
   * Retrieves all NPC factions in the EVE universe.
   *
   * @returns A list of NPC factions
   */
  getFactions(): Promise<Faction[]> {
    return this.api.getFactions() as Promise<Faction[]>;
  }

  /**
   * Retrieves information about a specific graphic asset used in the EVE client.
   *
   * @param graphicId - The ID of the graphic
   * @returns Detailed graphic information
   */
  getGraphicById(graphicId: number): Promise<GraphicInfo> {
    return this.api.getGraphicById(graphicId) as Promise<GraphicInfo>;
  }

  /**
   * Retrieves a list of all graphic asset IDs.
   *
   * @returns A list of graphic IDs
   */
  getGraphics(): Promise<number[]> {
    return this.api.getGraphics() as Promise<number[]>;
  }

  /**
   * Retrieves a list of all item category IDs in the EVE universe.
   *
   * @returns A list of item category IDs
   */
  getItemCategories(): Promise<number[]> {
    return this.api.getCategories() as Promise<number[]>;
  }

  /**
   * Retrieves information about a specific item category, including its groups.
   *
   * @param categoryId - The ID of the item category
   * @returns Detailed item category information
   */
  getItemCategoryById(categoryId: number): Promise<ItemCategory> {
    return this.api.getCategoryById(categoryId) as Promise<ItemCategory>;
  }

  /**
   * Retrieves information about a specific item group, including its types.
   *
   * @param groupId - The ID of the item group
   * @returns Detailed item group information
   */
  getItemGroupById(groupId: number): Promise<ItemGroup> {
    return this.api.getItemGroupById(groupId) as Promise<ItemGroup>;
  }

  /**
   * Retrieves a list of all item group IDs in the EVE universe.
   *
   * @returns A list of item group IDs
   */
  getItemGroups(): Promise<number[]> {
    return this.api.getItemGroups() as Promise<number[]>;
  }

  /**
   * Retrieves information about a moon, including its name and position.
   *
   * @param moonId - The ID of the moon
   * @returns Detailed moon information
   */
  getMoonById(moonId: number): Promise<MoonInfo> {
    return this.api.getMoonById(moonId) as Promise<MoonInfo>;
  }

  /**
   * Retrieves information about a planet, including its name, type, and position.
   *
   * @param planetId - The ID of the planet
   * @returns Detailed planet information
   */
  getPlanetById(planetId: number): Promise<PlanetInfo> {
    return this.api.getPlanetById(planetId) as Promise<PlanetInfo>;
  }

  /**
   * Retrieves all playable races in the EVE universe.
   *
   * @returns A list of playable races
   */
  getRaces(): Promise<Race[]> {
    return this.api.getRaces() as Promise<Race[]>;
  }

  /**
   * Retrieves information about a region, including its constellations and name.
   *
   * @param regionId - The ID of the region
   * @returns Detailed region information
   */
  getRegionById(regionId: number): Promise<RegionInfo> {
    return this.api.getRegionById(regionId) as Promise<RegionInfo>;
  }

  /**
   * Retrieves information about a star, including its spectral class and luminosity.
   *
   * @param starId - The ID of the star
   * @returns Detailed star information
   */
  getStarById(starId: number): Promise<StarInfo> {
    return this.api.getStarById(starId) as Promise<StarInfo>;
  }

  /**
   * Retrieves information about a stargate, including its destination and position.
   *
   * @param stargateId - The ID of the stargate
   * @returns Detailed stargate information
   */
  getStargateById(stargateId: number): Promise<StargateInfo> {
    return this.api.getStargateById(stargateId) as Promise<StargateInfo>;
  }

  /**
   * Retrieves public information about a station, including its services and location.
   *
   * @param stationId - The ID of the station
   * @returns Detailed station information
   */
  getStationById(stationId: number): Promise<StationInfo> {
    return this.api.getStationById(stationId) as Promise<StationInfo>;
  }

  /**
   * Retrieves information about a player-owned structure by its ID.
   *
   * @param structureId - The ID of the structure
   * @returns Detailed structure information
   * @requires Authentication
   */
  getStructureById(structureId: number): Promise<StructureInfo> {
    return this.api.getStructureById(structureId) as Promise<StructureInfo>;
  }

  /**
   * Retrieves a list of all publicly visible player-owned structure IDs.
   *
   * @returns A list of structure IDs
   */
  getStructures(): Promise<number[]> {
    return this.api.getStructures() as Promise<number[]>;
  }

  /**
   * Retrieves information about a solar system, including its planets, stargates, and security status.
   *
   * @param systemId - The ID of the solar system
   * @returns Detailed solar system information
   */
  getSystemById(systemId: number): Promise<SolarSystemInfo> {
    return this.api.getSystemById(systemId) as Promise<SolarSystemInfo>;
  }

  /**
   * Retrieves the number of ship jumps per solar system within the last hour.
   *
   * @returns A list of solar systems with their jump counts
   */
  getSystemJumps(): Promise<SystemJump[]> {
    return this.api.getSystemJumps() as Promise<SystemJump[]>;
  }

  /**
   * Retrieves the number of NPC and player ship kills per solar system within the last hour.
   *
   * @returns A list of solar systems with their kill counts
   */
  getSystemKills(): Promise<SystemKill[]> {
    return this.api.getSystemKills() as Promise<SystemKill[]>;
  }

  /**
   * Retrieves a list of all solar system IDs in the EVE universe.
   *
   * @returns A list of solar system IDs
   */
  getSystems(): Promise<number[]> {
    return this.api.getSystems() as Promise<number[]>;
  }

  /**
   * Retrieves information about a specific item type, including its description and attributes.
   *
   * @param typeId - The ID of the item type
   * @returns Detailed item type information
   */
  getTypeById(typeId: number): Promise<TypeInfo> {
    return this.api.getTypeById(typeId) as Promise<TypeInfo>;
  }

  /**
   * Retrieves a list of all item type IDs in the EVE universe.
   *
   * @returns A list of item type IDs
   */
  getTypes(): Promise<number[]> {
    return this.api.getTypes() as Promise<number[]>;
  }

  /**
   * Resolves a list of names to their corresponding IDs via a bulk POST operation.
   *
   * @param ids - An array of names to resolve to IDs
   * @returns The resolved IDs grouped by entity category
   */
  postBulkNamesToIds(ids: number[]): Promise<BulkIdResult> {
    return this.api.postBulkNamesToIds(ids) as Promise<BulkIdResult>;
  }

  /**
   * Resolves a list of IDs to their names and categories via a bulk POST operation.
   *
   * @param ids - An array of entity IDs to resolve
   * @returns A list of names with their corresponding categories
   */
  postNamesAndCategories(ids: number[]): Promise<NameAndCategory[]> {
    return this.api.postNamesAndCategories(ids) as Promise<NameAndCategory[]>;
  }

  /**
   * Retrieves information about a planetary interaction schematic.
   *
   * @param schematicId - The ID of the PI schematic
   * @returns Detailed schematic information including inputs and outputs
   */
  getSchematicById(schematicId: number): Promise<SchematicInfo> {
    return this.api.getSchematicById(schematicId) as Promise<SchematicInfo>;
  }

  /**
   * Retrieves a list of all region IDs in the EVE universe.
   *
   * @returns A list of region IDs
   */
  getRegions(): Promise<number[]> {
    return this.api.getRegions() as Promise<number[]>;
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
