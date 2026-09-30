/**
 * SDE domain: the map: regions, constellations, solar systems, stargates, celestials and what sits in space.
 *
 * Types for the tables of this domain; the Zod schemas that validate them
 * are in ./schemas.ts (split out of the former src/sde/types.ts, Track S
 * Run 12).
 */

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Position2D {
  x: number;
  y: number;
}

export interface StarStatistics {
  age: number;
  life: number;
  luminosity: number;
  locked: boolean;
  spectralClass: string;
  temperature: number;
}

export interface StargateDestination {
  solarSystemId: number;
  stargateId: number;
}

/** eve_applied_proximity_effects [118 rows] */
export interface AppliedProximityEffect {
  appliedProximityEffectId: number;
  dbuffs: unknown;
  delaySeconds: number;
  radius: number;
}

/** eve_asteroid_belts [40928 rows] */
export interface AsteroidBelt {
  asteroidBeltId: number;
  celestialIndex: number;
  orbitId: number;
  orbitIndex: number;
  position: Position3D;
  radius: number;
  solarSystemId: number;
  statistics: unknown;
  typeId: number;
  /** The belt's own name, on the belts that have one. */
  uniqueName?: string;
}

/** eve_constellations [1184 rows] */
export interface Constellation {
  constellationId: number;
  factionId: number;
  name: string;
  position: Position3D;
  regionId: number;
  solarSystemIDs: number[];
  wormholeClassId: number;
}

/** eve_landmarks [45 rows] */
export interface Landmark {
  landmarkId: number;
  description: string;
  name: string;
  position: Position3D;
  iconId: number | null;
  locationId: number | null;
}

/** eve_metenox_moon_drill [1 row] */
export interface MetenoxMoonDrill {
  metenoxMoonDrillId: number;
  miningCycleTime: number;
  miningEfficiency: number;
  reagentsConsumedPerCycle: number;
}

/** eve_moons [344457 rows] */
export interface Moon {
  moonId: number;
  attributes: unknown;
  celestialIndex: number;
  orbitId: number;
  orbitIndex: number;
  position: Position3D;
  radius: number;
  solarSystemId: number;
  statistics: unknown;
  typeId: number;
  npcStationIDs: number[] | null;
  /** The moon's own name, on the moons that have one. */
  uniqueName?: string;
}

/** eve_planet_resources [25798 rows] */
export interface PlanetResource {
  planetId: number;
  power: number;
  workforce: number | null;
  reagent: unknown;
}

/** eve_planets [68407 rows] */
export interface Planet {
  planetId: number;
  asteroidBeltIDs: number[];
  attributes: unknown;
  celestialIndex: number;
  moonIDs: number[];
  orbitId: number;
  position: Position3D;
  radius: number;
  solarSystemId: number;
  statistics: unknown;
  typeId: number;
  npcStationIDs: number[] | null;
  /** The planet's own name, on the planets that have one. */
  uniqueName?: string;
}

/** eve_proximity_traps [24 rows] */
export interface ProximityTrap {
  proximityTrapId: number;
  dbuffDuration: number;
  showPerimeterLights: boolean;
  triggerDelay: number;
  triggerFilterTypeListId: number;
  triggerRange: number;
  dbuffs: unknown;
  forceDecloakDuration: number | null;
  resetDelay: number | null;
}

/** eve_regions [114 rows] */
export interface Region {
  regionId: number;
  constellationIDs: number[];
  description: string;
  factionId: number;
  name: string;
  nebulaId: number;
  position: Position3D;
  wormholeClassId: number;
}

/** eve_secondary_suns [1038 rows] */
export interface SecondarySun {
  secondarySunId: number;
  effectBeaconTypeId: number;
  position: Position3D;
  solarSystemId: number;
  typeId: number;
}

/** eve_solar_systems [8490 rows] */
export interface SolarSystem {
  systemId: number;
  border: boolean;
  constellationId: number;
  hub: boolean;
  international: boolean;
  luminosity: number;
  name: string;
  planetIDs: number[];
  position: Position3D;
  position2D: Position2D;
  radius: number;
  regionId: number;
  regional: boolean;
  securityClass: string;
  securityStatus: number;
  starId: number;
  stargateIDs: number[];
  corridor: boolean | null;
  fringe: boolean | null;
  wormholeClassId: number | null;
  visualEffect: string | null;
  /** Categories that cannot be anchored in the system. */
  disallowedAnchorCategories?: number[];
  /** Groups that cannot be anchored in the system. */
  disallowedAnchorGroups?: number[];
  /** The faction that owns the system, on faction-held systems. */
  factionId?: number;
}

/** eve_sovereignty_upgrades [49 rows] */
export interface SovereigntyUpgrade {
  typeId: number;
  fuel: unknown;
  mutually_exclusive_group: string;
  power_allocation: number;
  workforce_allocation: number;
  power_production: number | null;
  workforce_production: number | null;
}

/** eve_stargates [13978 rows] */
export interface Stargate {
  stargateId: number;
  destination: StargateDestination;
  position: Position3D;
  solarSystemId: number;
  typeId: number;
}

/** eve_stars [8089 rows] */
export interface Star {
  starId: number;
  radius: number;
  solarSystemId: number;
  statistics: StarStatistics;
  typeId: number;
}

/** eve_system_dbuff_emitters [1 row] */
export interface SystemDbuffEmitter {
  systemDbuffEmitterId: number;
  dbuffs: unknown;
  duration: number;
  excludeProtected: boolean;
  interval: number;
}

/** eve_system_wide_effects [95 rows] */
export interface SystemWideEffect {
  systemWideEffectId: number;
  dbuffs: unknown;
  eligibleTypeListId: number;
  environmentTypeId: number | null;
}
