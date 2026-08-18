export interface EveType {
  typeId: number;
  groupId: number;
  name: string;
  description: string;
  mass: number | null;
  volume: number | null;
  capacity: number | null;
  portionSize: number;
  published: boolean;
  marketGroupId: number | null;
  iconId: number | null;
  graphicId: number | null;
}

export interface EveGroup {
  groupId: number;
  categoryId: number;
  name: string;
  published: boolean;
}

export interface EveCategory {
  categoryId: number;
  name: string;
  published: boolean;
}

export interface Region {
  regionId: number;
  name: string;
  description: string | null;
}

export interface Constellation {
  constellationId: number;
  regionId: number;
  name: string;
}

export interface SolarSystem {
  systemId: number;
  constellationId: number;
  regionId: number;
  name: string;
  securityStatus: number;
  securityClass: string | null;
}

export interface Stargate {
  stargateId: number;
  systemId: number;
  typeId: number;
  destinationStargateId: number;
  destinationSystemId: number;
}

export interface Star {
  starId: number;
  solarSystemId: number;
  name: string;
  typeId: number;
  age: number;
  luminosity: number;
  radius: number;
  spectralClass: string;
  temperature: number;
}

export interface Planet {
  planetId: number;
  solarSystemId: number;
  name: string;
  typeId: number;
  celestialIndex: number;
}

export interface Moon {
  moonId: number;
  planetId: number;
  name: string;
  typeId: number;
  celestialIndex: number;
}

export interface AsteroidBelt {
  asteroidBeltId: number;
  solarSystemId: number;
  name: string;
  typeId: number;
  celestialIndex: number;
}

export interface Faction {
  factionId: number;
  name: string;
  description: string;
  raceIds: number[];
  solarSystemId: number | null;
  corporationId: number | null;
  militiaCorporationId: number | null;
  sizeFactor: number;
}

export interface Race {
  raceId: number;
  name: string;
  description: string;
  iconId: number | null;
}

export interface Bloodline {
  bloodlineId: number;
  raceId: number;
  name: string;
  description: string;
  shipTypeId: number;
  corporationId: number;
  iconId: number | null;
}

export interface Ancestry {
  ancestryId: number;
  bloodlineId: number;
  name: string;
  description: string;
  iconId: number | null;
}

export interface NpcCorporation {
  corporationId: number;
  name: string;
  factionId: number | null;
  solarSystemId: number | null;
  stationId: number | null;
  description: string;
  iconId: number | null;
  raceId: number | null;
}

export interface NpcStation {
  stationId: number;
  name: string;
  solarSystemId: number;
  typeId: number;
  corporationId: number;
  regionId: number;
  constellationId: number;
  security: number;
  reprocessingEfficiency: number;
  reprocessingStationsTake: number;
}

export interface MarketGroup {
  marketGroupId: number;
  name: string;
  description: string;
  parentGroupId: number | null;
  iconId: number | null;
  hasTypes: boolean;
}

export interface MetaGroup {
  metaGroupId: number;
  name: string;
  description: string;
  iconId: number | null;
}

export interface Icon {
  iconId: number;
  iconFile: string;
  description: string;
}

export interface Graphic {
  graphicId: number;
  graphicFile: string;
  description: string;
  sofFactionName: string | null;
  sofHullName: string | null;
  sofRaceName: string | null;
}

export interface DogmaAttribute {
  attributeId: number;
  name: string;
  description: string;
  categoryId: number | null;
  defaultValue: number;
  highIsGood: boolean;
  stackable: boolean;
  unitId: number | null;
  iconId: number | null;
  published: boolean;
}

export interface DogmaEffect {
  effectId: number;
  name: string;
  description: string;
  categoryId: number | null;
  isAssistance: boolean;
  isOffensive: boolean;
  isWarpSafe: boolean;
  published: boolean;
  iconId: number | null;
  dischargeAttributeId: number | null;
  durationAttributeId: number | null;
  falloffAttributeId: number | null;
  rangeAttributeId: number | null;
  trackingSpeedAttributeId: number | null;
}

export interface BlueprintMaterial {
  typeId: number;
  quantity: number;
}

export interface BlueprintProduct {
  typeId: number;
  quantity: number;
  probability: number | null;
}

export interface BlueprintActivity {
  time: number;
  materials: BlueprintMaterial[];
  products: BlueprintProduct[];
}

export interface Blueprint {
  blueprintTypeId: number;
  maxProductionLimit: number;
  manufacturing: BlueprintActivity | null;
  research: BlueprintActivity | null;
  copying: BlueprintActivity | null;
  invention: BlueprintActivity | null;
}

export interface PlanetSchematicType {
  typeId: number;
  isInput: boolean;
  quantity: number;
}

export interface PlanetSchematic {
  planetSchematicId: number;
  name: string;
  cycleTime: number;
  types: PlanetSchematicType[];
}
