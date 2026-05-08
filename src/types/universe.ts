export interface SolarSystemInfo {
  system_id: number;
  name: string;
  constellation_id: number;
  security_class?: string;
  security_status: number;
  star_id?: number;
  stargates?: number[];
  stations?: number[];
  planets?: {
    asteroid_belts?: number[];
    moons?: number[];
    planet_id: number;
  }[];
}

export interface ConstellationInfo {
  constellation_id: number;
  name: string;
  region_id: number;
  systems: number[];
  position: {
    x: number;
    y: number;
    z: number;
  };
}

export interface RegionInfo {
  region_id: number;
  name: string;
  description?: string;
  constellations: number[];
}

export interface Ancestry {
  id: number;
  name: string;
  bloodline_id: number;
  description: string;
  short_description?: string;
  icon_id?: number;
}

export interface Bloodline {
  bloodline_id: number;
  name: string;
  description: string;
  race_id: number;
  corporation_id: number;
  ship_type_id: number;
  charisma: number;
  intelligence: number;
  memory: number;
  perception: number;
  willpower: number;
}

export interface Faction {
  faction_id: number;
  name: string;
  description: string;
  size_factor: number;
  station_count: number;
  station_system_count: number;
  is_unique: boolean;
  solar_system_id?: number;
  corporation_id?: number;
  militia_corporation_id?: number;
}

export interface Race {
  race_id: number;
  name: string;
  description: string;
  alliance_id: number;
}

export interface StationInfo {
  station_id: number;
  name: string;
  owner?: number;
  system_id: number;
  type_id: number;
  race_id?: number;
  reprocessing_efficiency: number;
  reprocessing_stations_take: number;
  max_dockable_ship_volume: number;
  office_rental_cost: number;
  services: string[];
  position: { x: number; y: number; z: number };
}

export interface TypeInfo {
  type_id: number;
  name: string;
  description: string;
  published: boolean;
  group_id: number;
  market_group_id?: number;
  radius?: number;
  volume?: number;
  capacity?: number;
  portion_size?: number;
  mass?: number;
  icon_id?: number;
  graphic_id?: number;
  dogma_attributes?: { attribute_id: number; value: number }[];
  dogma_effects?: { effect_id: number; is_default: boolean }[];
}

export interface AsteroidBeltInfo {
  name: string;
  position: { x: number; y: number; z: number };
  system_id: number;
}

export interface GraphicInfo {
  graphic_id: number;
  collision_file?: string;
  graphic_file?: string;
  icon_folder?: string;
  sofico_folder?: string;
}

export interface ItemCategory {
  category_id: number;
  name: string;
  groups: number[];
  published: boolean;
}

export interface ItemGroup {
  group_id: number;
  name: string;
  category_id: number;
  types: number[];
  published: boolean;
}

export interface MoonInfo {
  moon_id: number;
  name: string;
  system_id: number;
  position: { x: number; y: number; z: number };
}

export interface PlanetInfo {
  planet_id: number;
  name: string;
  system_id: number;
  type_id: number;
  position: { x: number; y: number; z: number };
}

export interface StarInfo {
  star_id: number;
  solar_system_id: number;
  name: string;
  type_id: number;
  age: number;
  luminosity: number;
  radius: number;
  spectral_class: string;
  temperature: number;
}

export interface StargateInfo {
  stargate_id: number;
  name: string;
  system_id: number;
  type_id: number;
  position: { x: number; y: number; z: number };
  destination: { system_id: number; stargate_id: number };
}

export interface StructureInfo {
  structure_id: number;
  name: string;
  owner_id: number;
  solar_system_id: number;
  type_id?: number;
  position?: { x: number; y: number; z: number };
}

export interface SystemJump {
  system_id: number;
  ship_jumps: number;
}

export interface SystemKill {
  system_id: number;
  npc_kills: number;
  pod_kills: number;
  ship_kills: number;
}

export interface BulkIdResult {
  agents?: { id: number; name: string }[];
  alliances?: { id: number; name: string }[];
  characters?: { id: number; name: string }[];
  constellations?: { id: number; name: string }[];
  corporations?: { id: number; name: string }[];
  factions?: { id: number; name: string }[];
  inventory_types?: { id: number; name: string }[];
  regions?: { id: number; name: string }[];
  systems?: { id: number; name: string }[];
  stations?: { id: number; name: string }[];
}

export interface NameAndCategory {
  id: number;
  name: string;
  category:
    | 'alliance'
    | 'character'
    | 'constellation'
    | 'corporation'
    | 'inventory_type'
    | 'region'
    | 'solar_system'
    | 'station'
    | 'faction';
}

export interface SchematicInfo {
  schematic_name: string;
  cycle_time: number;
}

export interface SearchResult {
  agent?: number[];
  alliance?: number[];
  character?: number[];
  constellation?: number[];
  corporation?: number[];
  faction?: number[];
  inventory_type?: number[];
  region?: number[];
  solar_system?: number[];
  station?: number[];
  structure?: number[];
}
