import { z } from 'zod';

export const EveTypeSchema = z.looseObject({
  typeId: z.number().int(),
  groupId: z.number().int(),
  name: z.string(),
  description: z.string(),
  mass: z.number().nullable(),
  volume: z.number().nullable(),
  capacity: z.number().nullable(),
  portionSize: z.number().int(),
  published: z.boolean(),
  marketGroupId: z.number().int().nullable(),
  iconId: z.number().int().nullable(),
  graphicId: z.number().int().nullable(),
});

export const EveGroupSchema = z.looseObject({
  groupId: z.number().int(),
  categoryId: z.number().int(),
  name: z.string(),
  published: z.boolean(),
});

export const EveCategorySchema = z.looseObject({
  categoryId: z.number().int(),
  name: z.string(),
  published: z.boolean(),
});

export const RegionSchema = z.looseObject({
  regionId: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
});

export const ConstellationSchema = z.looseObject({
  constellationId: z.number().int(),
  regionId: z.number().int(),
  name: z.string(),
});

export const SolarSystemSchema = z.looseObject({
  systemId: z.number().int(),
  constellationId: z.number().int(),
  regionId: z.number().int(),
  name: z.string(),
  securityStatus: z.number(),
  securityClass: z.string().nullable(),
});

export const StargateSchema = z.looseObject({
  stargateId: z.number().int(),
  systemId: z.number().int(),
  typeId: z.number().int(),
  destinationStargateId: z.number().int(),
  destinationSystemId: z.number().int(),
});

export const StarSchema = z.looseObject({
  starId: z.number().int(),
  solarSystemId: z.number().int(),
  name: z.string(),
  typeId: z.number().int(),
  age: z.number(),
  luminosity: z.number(),
  radius: z.number(),
  spectralClass: z.string(),
  temperature: z.number(),
});

export const PlanetSchema = z.looseObject({
  planetId: z.number().int(),
  solarSystemId: z.number().int(),
  name: z.string(),
  typeId: z.number().int(),
  celestialIndex: z.number().int(),
});

export const MoonSchema = z.looseObject({
  moonId: z.number().int(),
  planetId: z.number().int(),
  name: z.string(),
  typeId: z.number().int(),
  celestialIndex: z.number().int(),
});

export const AsteroidBeltSchema = z.looseObject({
  asteroidBeltId: z.number().int(),
  solarSystemId: z.number().int(),
  name: z.string(),
  typeId: z.number().int(),
  celestialIndex: z.number().int(),
});

export const FactionSchema = z.looseObject({
  factionId: z.number().int(),
  name: z.string(),
  description: z.string(),
  raceIds: z.array(z.number().int()),
  solarSystemId: z.number().int().nullable(),
  corporationId: z.number().int().nullable(),
  militiaCorporationId: z.number().int().nullable(),
  sizeFactor: z.number(),
});

export const RaceSchema = z.looseObject({
  raceId: z.number().int(),
  name: z.string(),
  description: z.string(),
  iconId: z.number().int().nullable(),
});

export const BloodlineSchema = z.looseObject({
  bloodlineId: z.number().int(),
  raceId: z.number().int(),
  name: z.string(),
  description: z.string(),
  shipTypeId: z.number().int(),
  corporationId: z.number().int(),
  iconId: z.number().int().nullable(),
});

export const AncestrySchema = z.looseObject({
  ancestryId: z.number().int(),
  bloodlineId: z.number().int(),
  name: z.string(),
  description: z.string(),
  iconId: z.number().int().nullable(),
});

export const NpcCorporationSchema = z.looseObject({
  corporationId: z.number().int(),
  name: z.string(),
  factionId: z.number().int().nullable(),
  solarSystemId: z.number().int().nullable(),
  stationId: z.number().int().nullable(),
  description: z.string(),
  iconId: z.number().int().nullable(),
  raceId: z.number().int().nullable(),
});

export const NpcStationSchema = z.looseObject({
  stationId: z.number().int(),
  name: z.string(),
  solarSystemId: z.number().int(),
  typeId: z.number().int(),
  corporationId: z.number().int(),
  regionId: z.number().int(),
  constellationId: z.number().int(),
  security: z.number(),
  reprocessingEfficiency: z.number(),
  reprocessingStationsTake: z.number(),
});

export const MarketGroupSchema = z.looseObject({
  marketGroupId: z.number().int(),
  name: z.string(),
  description: z.string(),
  parentGroupId: z.number().int().nullable(),
  iconId: z.number().int().nullable(),
  hasTypes: z.boolean(),
});

export const MetaGroupSchema = z.looseObject({
  metaGroupId: z.number().int(),
  name: z.string(),
  description: z.string(),
  iconId: z.number().int().nullable(),
});

export const IconSchema = z.looseObject({
  iconId: z.number().int(),
  iconFile: z.string(),
  description: z.string(),
});

export const GraphicSchema = z.looseObject({
  graphicId: z.number().int(),
  graphicFile: z.string(),
  description: z.string(),
  sofFactionName: z.string().nullable(),
  sofHullName: z.string().nullable(),
  sofRaceName: z.string().nullable(),
});

export const DogmaAttributeSchema = z.looseObject({
  attributeId: z.number().int(),
  name: z.string(),
  description: z.string(),
  categoryId: z.number().int().nullable(),
  defaultValue: z.number(),
  highIsGood: z.boolean(),
  stackable: z.boolean(),
  unitId: z.number().int().nullable(),
  iconId: z.number().int().nullable(),
  published: z.boolean(),
});

export const DogmaEffectSchema = z.looseObject({
  effectId: z.number().int(),
  name: z.string(),
  description: z.string(),
  categoryId: z.number().int().nullable(),
  isAssistance: z.boolean(),
  isOffensive: z.boolean(),
  isWarpSafe: z.boolean(),
  published: z.boolean(),
  iconId: z.number().int().nullable(),
  dischargeAttributeId: z.number().int().nullable(),
  durationAttributeId: z.number().int().nullable(),
  falloffAttributeId: z.number().int().nullable(),
  rangeAttributeId: z.number().int().nullable(),
  trackingSpeedAttributeId: z.number().int().nullable(),
});

export const BlueprintMaterialSchema = z.looseObject({
  typeId: z.number().int(),
  quantity: z.number().int(),
});

export const BlueprintProductSchema = z.looseObject({
  typeId: z.number().int(),
  quantity: z.number().int(),
  probability: z.number().nullable(),
});

export const BlueprintActivitySchema = z.looseObject({
  time: z.number().int(),
  materials: z.array(BlueprintMaterialSchema),
  products: z.array(BlueprintProductSchema),
});

export const BlueprintSchema = z.looseObject({
  blueprintTypeId: z.number().int(),
  maxProductionLimit: z.number().int(),
  manufacturing: BlueprintActivitySchema.nullable(),
  research: BlueprintActivitySchema.nullable(),
  copying: BlueprintActivitySchema.nullable(),
  invention: BlueprintActivitySchema.nullable(),
});

export const PlanetSchematicTypeSchema = z.looseObject({
  typeId: z.number().int(),
  isInput: z.boolean(),
  quantity: z.number().int(),
});

export const PlanetSchematicSchema = z.looseObject({
  planetSchematicId: z.number().int(),
  name: z.string(),
  cycleTime: z.number().int(),
  types: z.array(PlanetSchematicTypeSchema),
});

export const SdeVersionSchema = z.looseObject({
  version: z.string(),
  buildDate: z.string(),
  importedAt: z.string(),
  checksum: z.string().optional(),
});
