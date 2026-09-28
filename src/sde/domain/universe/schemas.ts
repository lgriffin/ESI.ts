/**
 * SDE domain: the map: regions, constellations, solar systems, stargates, celestials and what sits in space.
 *
 * Zod schemas for the tables of this domain, next to the types in
 * ./types.ts they validate (split out of the former src/sde/schemas.ts,
 * Track S Run 12).
 */

import { z } from 'zod';

export const Position3DSchema = z.looseObject({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const Position2DSchema = z.looseObject({
  x: z.number(),
  y: z.number(),
});

export const StarStatisticsSchema = z.looseObject({
  age: z.number(),
  life: z.number(),
  luminosity: z.number(),
  locked: z.boolean(),
  spectralClass: z.string(),
  temperature: z.number(),
});

export const StargateDestinationSchema = z.looseObject({
  solarSystemId: z.number().int(),
  stargateId: z.number().int(),
});

export const AppliedProximityEffectSchema = z.looseObject({
  appliedProximityEffectId: z.number().int(),
  dbuffs: z.unknown(),
  delaySeconds: z.number().int(),
  radius: z.number().int(),
});

export const AsteroidBeltSchema = z.looseObject({
  asteroidBeltId: z.number().int(),
  celestialIndex: z.number().int(),
  orbitId: z.number().int(),
  orbitIndex: z.number().int(),
  position: Position3DSchema,
  radius: z.number(),
  solarSystemId: z.number().int(),
  statistics: z.unknown(),
  typeId: z.number().int(),
});

export const ConstellationSchema = z.looseObject({
  constellationId: z.number().int(),
  factionId: z.number().int(),
  name: z.string(),
  position: Position3DSchema,
  regionId: z.number().int(),
  solarSystemIDs: z.array(z.number().int()),
  wormholeClassId: z.number().int(),
});

export const LandmarkSchema = z.looseObject({
  landmarkId: z.number().int(),
  description: z.string(),
  name: z.string(),
  position: Position3DSchema,
  iconId: z.number().int().nullable(),
  locationId: z.number().int().nullable(),
});

export const MetenoxMoonDrillSchema = z.looseObject({
  metenoxMoonDrillId: z.number().int(),
  miningCycleTime: z.number().int(),
  miningEfficiency: z.number(),
  reagentsConsumedPerCycle: z.number().int(),
});

export const MoonSchema = z.looseObject({
  moonId: z.number().int(),
  attributes: z.unknown(),
  celestialIndex: z.number().int(),
  orbitId: z.number().int(),
  orbitIndex: z.number().int(),
  position: Position3DSchema,
  radius: z.number(),
  solarSystemId: z.number().int(),
  statistics: z.unknown(),
  typeId: z.number().int(),
  npcStationIDs: z.array(z.number().int()).nullable(),
});

export const PlanetResourceSchema = z.looseObject({
  planetId: z.number().int(),
  power: z.number().int(),
  workforce: z.number().int().nullable(),
  reagent: z.unknown().nullable(),
});

export const PlanetSchema = z.looseObject({
  planetId: z.number().int(),
  asteroidBeltIDs: z.array(z.number().int()),
  attributes: z.unknown(),
  celestialIndex: z.number().int(),
  moonIDs: z.array(z.number().int()),
  orbitId: z.number().int(),
  position: Position3DSchema,
  radius: z.number(),
  solarSystemId: z.number().int(),
  statistics: z.unknown(),
  typeId: z.number().int(),
  npcStationIDs: z.array(z.number().int()).nullable(),
});

export const ProximityTrapSchema = z.looseObject({
  proximityTrapId: z.number().int(),
  dbuffDuration: z.number().int(),
  showPerimeterLights: z.boolean(),
  triggerDelay: z.number().int(),
  triggerFilterTypeListId: z.number().int(),
  triggerRange: z.number().int(),
  dbuffs: z.unknown().nullable(),
  forceDecloakDuration: z.number().int().nullable(),
  resetDelay: z.number().int().nullable(),
});

export const RegionSchema = z.looseObject({
  regionId: z.number().int(),
  constellationIDs: z.array(z.number().int()),
  description: z.string(),
  factionId: z.number().int(),
  name: z.string(),
  nebulaId: z.number().int(),
  position: Position3DSchema,
  wormholeClassId: z.number().int(),
});

export const SecondarySunSchema = z.looseObject({
  secondarySunId: z.number().int(),
  effectBeaconTypeId: z.number().int(),
  position: Position3DSchema,
  solarSystemId: z.number().int(),
  typeId: z.number().int(),
});

export const SolarSystemSchema = z.looseObject({
  systemId: z.number().int(),
  border: z.boolean(),
  constellationId: z.number().int(),
  hub: z.boolean(),
  international: z.boolean(),
  luminosity: z.number(),
  name: z.string(),
  planetIDs: z.array(z.number().int()),
  position: Position3DSchema,
  position2D: Position2DSchema,
  radius: z.number(),
  regionId: z.number().int(),
  regional: z.boolean(),
  securityClass: z.string(),
  securityStatus: z.number(),
  starId: z.number().int(),
  stargateIDs: z.array(z.number().int()),
  corridor: z.boolean().nullable(),
  fringe: z.boolean().nullable(),
  wormholeClassId: z.number().int().nullable(),
  visualEffect: z.string().nullable(),
});

export const SovereigntyUpgradeSchema = z.looseObject({
  typeId: z.number().int(),
  fuel: z.unknown(),
  mutually_exclusive_group: z.string(),
  power_allocation: z.number().int(),
  workforce_allocation: z.number().int(),
  power_production: z.number().int().nullable(),
  workforce_production: z.number().int().nullable(),
});

export const StargateSchema = z.looseObject({
  stargateId: z.number().int(),
  destination: StargateDestinationSchema,
  position: Position3DSchema,
  solarSystemId: z.number().int(),
  typeId: z.number().int(),
});

export const StarSchema = z.looseObject({
  starId: z.number().int(),
  radius: z.number(),
  solarSystemId: z.number().int(),
  statistics: StarStatisticsSchema,
  typeId: z.number().int(),
});

export const SystemDbuffEmitterSchema = z.looseObject({
  systemDbuffEmitterId: z.number().int(),
  dbuffs: z.unknown(),
  duration: z.number().int(),
  excludeProtected: z.boolean(),
  interval: z.number().int(),
});

export const SystemWideEffectSchema = z.looseObject({
  systemWideEffectId: z.number().int(),
  dbuffs: z.unknown(),
  eligibleTypeListId: z.number().int(),
  environmentTypeId: z.number().int().nullable(),
});
