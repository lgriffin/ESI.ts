 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { universeEndpoints } from '../../core/endpoints/universeEndpoints';
import { AncestrySchema, AsteroidBeltInfoSchema, BloodlineSchema, BulkIdResultSchema, ConstellationInfoSchema, FactionSchema, GraphicInfoSchema, ItemCategorySchema, ItemGroupSchema, MoonInfoSchema, NameAndCategorySchema, PlanetInfoSchema, RaceSchema, RegionInfoSchema, SchematicInfoSchema, SolarSystemInfoSchema, StarInfoSchema, StargateInfoSchema, StationInfoSchema, StructureInfoSchema, SystemJumpSchema, SystemKillSchema, TypeInfoSchema } from '../../schemas/universe';

export class GeneratedUniverseClient extends BaseEsiClient<typeof universeEndpoints> {
  constructor(client: ApiClient) {
    super(client, universeEndpoints);
  }

  /**
   * GET getAncestries
   */
  getAncestries(): Promise<(z.infer<typeof AncestrySchema>)[]> {
    return this.api.getAncestries() as Promise<(z.infer<typeof AncestrySchema>)[]>;
  }

  /**
   * GET getAsteroidBeltInfo
   */
  getAsteroidBeltInfo(asteroidBeltId: number | string): Promise<z.infer<typeof AsteroidBeltInfoSchema>> {
    return this.api.getAsteroidBeltInfo(asteroidBeltId) as Promise<z.infer<typeof AsteroidBeltInfoSchema>>;
  }

  /**
   * GET getBloodlines
   */
  getBloodlines(): Promise<(z.infer<typeof BloodlineSchema>)[]> {
    return this.api.getBloodlines() as Promise<(z.infer<typeof BloodlineSchema>)[]>;
  }

  /**
   * GET getCategories
   */
  getCategories(): Promise<number[]> {
    return this.api.getCategories() as Promise<number[]>;
  }

  /**
   * GET getCategoryById
   */
  getCategoryById(categoryId: number | string): Promise<z.infer<typeof ItemCategorySchema>> {
    return this.api.getCategoryById(categoryId) as Promise<z.infer<typeof ItemCategorySchema>>;
  }

  /**
   * GET getConstellations
   */
  getConstellations(): Promise<number[]> {
    return this.api.getConstellations() as Promise<number[]>;
  }

  /**
   * GET getConstellationById
   */
  getConstellationById(constellationId: number | string): Promise<z.infer<typeof ConstellationInfoSchema>> {
    return this.api.getConstellationById(constellationId) as Promise<z.infer<typeof ConstellationInfoSchema>>;
  }

  /**
   * GET getFactions
   */
  getFactions(): Promise<(z.infer<typeof FactionSchema>)[]> {
    return this.api.getFactions() as Promise<(z.infer<typeof FactionSchema>)[]>;
  }

  /**
   * GET getGraphics
   */
  getGraphics(): Promise<number[]> {
    return this.api.getGraphics() as Promise<number[]>;
  }

  /**
   * GET getGraphicById
   */
  getGraphicById(graphicId: number | string): Promise<z.infer<typeof GraphicInfoSchema>> {
    return this.api.getGraphicById(graphicId) as Promise<z.infer<typeof GraphicInfoSchema>>;
  }

  /**
   * GET getItemGroups
   */
  getItemGroups(): Promise<number[]> {
    return this.api.getItemGroups() as Promise<number[]>;
  }

  /**
   * GET getItemGroupById
   */
  getItemGroupById(groupId: number | string): Promise<z.infer<typeof ItemGroupSchema>> {
    return this.api.getItemGroupById(groupId) as Promise<z.infer<typeof ItemGroupSchema>>;
  }

  /**
   * POST postBulkNamesToIds
   */
  postBulkNamesToIds(...args: Parameters<(typeof this.api)['postBulkNamesToIds']>): Promise<z.infer<typeof BulkIdResultSchema>> {
    return this.api.postBulkNamesToIds(...args) as Promise<z.infer<typeof BulkIdResultSchema>>;
  }

  /**
   * GET getMoonById
   */
  getMoonById(moonId: number | string): Promise<z.infer<typeof MoonInfoSchema>> {
    return this.api.getMoonById(moonId) as Promise<z.infer<typeof MoonInfoSchema>>;
  }

  /**
   * POST postNamesAndCategories
   */
  postNamesAndCategories(...args: Parameters<(typeof this.api)['postNamesAndCategories']>): Promise<(z.infer<typeof NameAndCategorySchema>)[]> {
    return this.api.postNamesAndCategories(...args) as Promise<(z.infer<typeof NameAndCategorySchema>)[]>;
  }

  /**
   * GET getPlanetById
   */
  getPlanetById(planetId: number | string): Promise<z.infer<typeof PlanetInfoSchema>> {
    return this.api.getPlanetById(planetId) as Promise<z.infer<typeof PlanetInfoSchema>>;
  }

  /**
   * GET getRaces
   */
  getRaces(): Promise<(z.infer<typeof RaceSchema>)[]> {
    return this.api.getRaces() as Promise<(z.infer<typeof RaceSchema>)[]>;
  }

  /**
   * GET getRegions
   */
  getRegions(): Promise<number[]> {
    return this.api.getRegions() as Promise<number[]>;
  }

  /**
   * GET getRegionById
   */
  getRegionById(regionId: number | string): Promise<z.infer<typeof RegionInfoSchema>> {
    return this.api.getRegionById(regionId) as Promise<z.infer<typeof RegionInfoSchema>>;
  }

  /**
   * GET getSchematicById
   */
  getSchematicById(schematicId: number | string): Promise<z.infer<typeof SchematicInfoSchema>> {
    return this.api.getSchematicById(schematicId) as Promise<z.infer<typeof SchematicInfoSchema>>;
  }

  /**
   * GET getStargateById
   */
  getStargateById(stargateId: number | string): Promise<z.infer<typeof StargateInfoSchema>> {
    return this.api.getStargateById(stargateId) as Promise<z.infer<typeof StargateInfoSchema>>;
  }

  /**
   * GET getStarById
   */
  getStarById(starId: number | string): Promise<z.infer<typeof StarInfoSchema>> {
    return this.api.getStarById(starId) as Promise<z.infer<typeof StarInfoSchema>>;
  }

  /**
   * GET getStationById
   */
  getStationById(stationId: number | string): Promise<z.infer<typeof StationInfoSchema>> {
    return this.api.getStationById(stationId) as Promise<z.infer<typeof StationInfoSchema>>;
  }

  /**
   * GET getStructures
   */
  getStructures(): Promise<number[]> {
    return this.api.getStructures() as Promise<number[]>;
  }

  /**
   * GET getStructureById
   * @requires Authentication
   */
  getStructureById(structureId: number | string): Promise<z.infer<typeof StructureInfoSchema>> {
    return this.api.getStructureById(structureId) as Promise<z.infer<typeof StructureInfoSchema>>;
  }

  /**
   * GET getSystemJumps
   */
  getSystemJumps(): Promise<(z.infer<typeof SystemJumpSchema>)[]> {
    return this.api.getSystemJumps() as Promise<(z.infer<typeof SystemJumpSchema>)[]>;
  }

  /**
   * GET getSystemKills
   */
  getSystemKills(): Promise<(z.infer<typeof SystemKillSchema>)[]> {
    return this.api.getSystemKills() as Promise<(z.infer<typeof SystemKillSchema>)[]>;
  }

  /**
   * GET getSystems
   */
  getSystems(): Promise<number[]> {
    return this.api.getSystems() as Promise<number[]>;
  }

  /**
   * GET getSystemById
   */
  getSystemById(systemId: number | string): Promise<z.infer<typeof SolarSystemInfoSchema>> {
    return this.api.getSystemById(systemId) as Promise<z.infer<typeof SolarSystemInfoSchema>>;
  }

  /**
   * GET getTypes
   */
  getTypes(): Promise<number[]> {
    return this.api.getTypes() as Promise<number[]>;
  }

  /**
   * GET getTypeById
   */
  getTypeById(typeId: number | string): Promise<z.infer<typeof TypeInfoSchema>> {
    return this.api.getTypeById(typeId) as Promise<z.infer<typeof TypeInfoSchema>>;
  }
}
