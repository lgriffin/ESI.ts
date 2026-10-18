import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  AncestrySchema,
  AsteroidBeltInfoSchema,
  BloodlineSchema,
  BulkIdResultSchema,
  ConstellationInfoSchema,
  FactionSchema,
  GraphicInfoSchema,
  ItemCategorySchema,
  ItemGroupSchema,
  MoonInfoSchema,
  NameAndCategorySchema,
  PlanetInfoSchema,
  RaceSchema,
  RegionInfoSchema,
  SchematicInfoSchema,
  SolarSystemInfoSchema,
  StarInfoSchema,
  StargateInfoSchema,
  StationInfoSchema,
  StructureInfoSchema,
  SystemJumpSchema,
  SystemKillSchema,
  TypeInfoSchema,
} from '../../schemas/universe';

export const universeEndpoints = {
  getAncestries: fromOperation('GetUniverseAncestries', {
    responseSchema: z.array(AncestrySchema),
  }),
  getAsteroidBeltInfo: fromOperation('GetUniverseAsteroidBeltsAsteroidBeltId', {
    pathParams: ['asteroidBeltId'],
    responseSchema: AsteroidBeltInfoSchema,
  }),
  getBloodlines: fromOperation('GetUniverseBloodlines', {
    responseSchema: z.array(BloodlineSchema),
  }),
  getCategories: fromOperation('GetUniverseCategories', {
    responseSchema: z.array(z.number()),
  }),
  getCategoryById: fromOperation('GetUniverseCategoriesCategoryId', {
    pathParams: ['categoryId'],
    responseSchema: ItemCategorySchema,
  }),
  getConstellations: fromOperation('GetUniverseConstellations', {
    responseSchema: z.array(z.number()),
  }),
  getConstellationById: fromOperation(
    'GetUniverseConstellationsConstellationId',
    {
      pathParams: ['constellationId'],
      responseSchema: ConstellationInfoSchema,
    },
  ),
  getFactions: fromOperation('GetUniverseFactions', {
    responseSchema: z.array(FactionSchema),
  }),
  getGraphics: fromOperation('GetUniverseGraphics', {
    responseSchema: z.array(z.number()),
  }),
  getGraphicById: fromOperation('GetUniverseGraphicsGraphicId', {
    pathParams: ['graphicId'],
    responseSchema: GraphicInfoSchema,
  }),
  getItemGroups: fromOperation('GetUniverseGroups', {
    responseSchema: z.array(z.number()),
  }),
  getItemGroupById: fromOperation('GetUniverseGroupsGroupId', {
    pathParams: ['groupId'],
    responseSchema: ItemGroupSchema,
  }),
  postBulkNamesToIds: fromOperation('PostUniverseIds', {
    bodyBuilder: (names: string[]) => names,
    responseSchema: BulkIdResultSchema,
    requestSchema: z.array(z.string().min(1)),
  }),
  getMoonById: fromOperation('GetUniverseMoonsMoonId', {
    pathParams: ['moonId'],
    responseSchema: MoonInfoSchema,
  }),
  postNamesAndCategories: fromOperation('PostUniverseNames', {
    bodyBuilder: (ids: number[]) => ids,
    responseSchema: z.array(NameAndCategorySchema),
    requestSchema: z.array(z.number().int()),
  }),
  getPlanetById: fromOperation('GetUniversePlanetsPlanetId', {
    pathParams: ['planetId'],
    responseSchema: PlanetInfoSchema,
  }),
  getRaces: fromOperation('GetUniverseRaces', {
    responseSchema: z.array(RaceSchema),
  }),
  getRegions: fromOperation('GetUniverseRegions', {
    responseSchema: z.array(z.number()),
  }),
  getRegionById: fromOperation('GetUniverseRegionsRegionId', {
    pathParams: ['regionId'],
    responseSchema: RegionInfoSchema,
  }),
  getSchematicById: fromOperation('GetUniverseSchematicsSchematicId', {
    pathParams: ['schematicId'],
    responseSchema: SchematicInfoSchema,
  }),
  getStargateById: fromOperation('GetUniverseStargatesStargateId', {
    pathParams: ['stargateId'],
    responseSchema: StargateInfoSchema,
  }),
  getStarById: fromOperation('GetUniverseStarsStarId', {
    pathParams: ['starId'],
    responseSchema: StarInfoSchema,
  }),
  getStationById: fromOperation('GetUniverseStationsStationId', {
    pathParams: ['stationId'],
    responseSchema: StationInfoSchema,
  }),
  getStructures: fromOperation('GetUniverseStructures', {
    responseSchema: z.array(z.number()),
  }),
  getStructureById: fromOperation('GetUniverseStructuresStructureId', {
    pathParams: ['structureId'],
    responseSchema: StructureInfoSchema,
  }),
  getSystemJumps: fromOperation('GetUniverseSystemJumps', {
    responseSchema: z.array(SystemJumpSchema),
  }),
  getSystemKills: fromOperation('GetUniverseSystemKills', {
    responseSchema: z.array(SystemKillSchema),
  }),
  getSystems: fromOperation('GetUniverseSystems', {
    responseSchema: z.array(z.number()),
  }),
  getSystemById: fromOperation('GetUniverseSystemsSystemId', {
    pathParams: ['systemId'],
    responseSchema: SolarSystemInfoSchema,
  }),
  getTypes: fromOperation('GetUniverseTypes', {
    responseSchema: z.array(z.number()),
  }),
  getTypeById: fromOperation('GetUniverseTypesTypeId', {
    pathParams: ['typeId'],
    responseSchema: TypeInfoSchema,
  }),
} as const satisfies EndpointMap;
