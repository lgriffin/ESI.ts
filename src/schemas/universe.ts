import { z } from 'zod';

const PositionSchema = z.looseObject({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const SolarSystemInfoSchema = z.looseObject({
  system_id: z.number(),
  name: z.string(),
  constellation_id: z.number(),
  security_class: z.string().optional(),
  security_status: z.number(),
  star_id: z.number().optional(),
  stargates: z.array(z.number()).optional(),
  stations: z.array(z.number()).optional(),
  planets: z
    .array(
      z.looseObject({
        asteroid_belts: z.array(z.number()).optional(),
        moons: z.array(z.number()).optional(),
        planet_id: z.number(),
      }),
    )
    .optional(),
});

export const ConstellationInfoSchema = z.looseObject({
  constellation_id: z.number(),
  name: z.string(),
  region_id: z.number(),
  systems: z.array(z.number()),
  position: PositionSchema,
});

export const RegionInfoSchema = z.looseObject({
  region_id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  constellations: z.array(z.number()),
});

export const AncestrySchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  bloodline_id: z.number(),
  description: z.string(),
  short_description: z.string().optional(),
  icon_id: z.number().optional(),
});

export const BloodlineSchema = z.looseObject({
  bloodline_id: z.number(),
  name: z.string(),
  description: z.string(),
  race_id: z.number(),
  corporation_id: z.number(),
  ship_type_id: z.number().nullable(),
  charisma: z.number(),
  intelligence: z.number(),
  memory: z.number(),
  perception: z.number(),
  willpower: z.number(),
});

export const FactionSchema = z.looseObject({
  faction_id: z.number(),
  name: z.string(),
  description: z.string(),
  size_factor: z.number(),
  station_count: z.number(),
  station_system_count: z.number(),
  is_unique: z.boolean(),
  solar_system_id: z.number().optional(),
  corporation_id: z.number().optional(),
  militia_corporation_id: z.number().optional(),
});

export const RaceSchema = z.looseObject({
  race_id: z.number(),
  name: z.string(),
  description: z.string(),
  alliance_id: z.number(),
});

export const StationInfoSchema = z.looseObject({
  station_id: z.number(),
  name: z.string(),
  owner: z.number().optional(),
  system_id: z.number(),
  type_id: z.number(),
  race_id: z.number().optional(),
  reprocessing_efficiency: z.number(),
  reprocessing_stations_take: z.number(),
  max_dockable_ship_volume: z.number(),
  office_rental_cost: z.number(),
  services: z.array(z.string()),
  position: PositionSchema,
});

export const TypeInfoSchema = z.looseObject({
  type_id: z.number(),
  name: z.string(),
  description: z.string(),
  published: z.boolean(),
  group_id: z.number(),
  market_group_id: z.number().optional(),
  radius: z.number().optional(),
  volume: z.number().optional(),
  capacity: z.number().optional(),
  portion_size: z.number().optional(),
  mass: z.number().optional(),
  icon_id: z.number().optional(),
  graphic_id: z.number().optional(),
  dogma_attributes: z
    .array(
      z.looseObject({
        attribute_id: z.number(),
        value: z.number(),
      }),
    )
    .optional(),
  dogma_effects: z
    .array(
      z.looseObject({
        effect_id: z.number(),
        is_default: z.boolean(),
      }),
    )
    .optional(),
});

export const AsteroidBeltInfoSchema = z.looseObject({
  name: z.string(),
  position: PositionSchema,
  system_id: z.number(),
});

export const GraphicInfoSchema = z.looseObject({
  graphic_id: z.number(),
  collision_file: z.string().optional(),
  graphic_file: z.string().optional(),
  icon_folder: z.string().optional(),
  sofico_folder: z.string().optional(),
});

export const ItemCategorySchema = z.looseObject({
  category_id: z.number(),
  name: z.string(),
  groups: z.array(z.number()),
  published: z.boolean(),
});

export const ItemGroupSchema = z.looseObject({
  group_id: z.number(),
  name: z.string(),
  category_id: z.number(),
  types: z.array(z.number()),
  published: z.boolean(),
});

export const MoonInfoSchema = z.looseObject({
  moon_id: z.number(),
  name: z.string(),
  system_id: z.number(),
  position: PositionSchema,
});

export const PlanetInfoSchema = z.looseObject({
  planet_id: z.number(),
  name: z.string(),
  system_id: z.number(),
  type_id: z.number(),
  position: PositionSchema,
});

export const StarInfoSchema = z.looseObject({
  star_id: z.number().optional(),
  solar_system_id: z.number(),
  name: z.string(),
  type_id: z.number(),
  age: z.number(),
  luminosity: z.number(),
  radius: z.number(),
  spectral_class: z.string(),
  temperature: z.number(),
});

export const StargateInfoSchema = z.looseObject({
  stargate_id: z.number(),
  name: z.string(),
  system_id: z.number(),
  type_id: z.number(),
  position: PositionSchema,
  destination: z.looseObject({
    system_id: z.number(),
    stargate_id: z.number(),
  }),
});

export const StructureInfoSchema = z.looseObject({
  structure_id: z.number().optional(),
  name: z.string(),
  owner_id: z.number(),
  solar_system_id: z.number(),
  type_id: z.number().optional(),
  position: PositionSchema.optional(),
});

export const SystemJumpSchema = z.looseObject({
  system_id: z.number(),
  ship_jumps: z.number(),
});

export const SystemKillSchema = z.looseObject({
  system_id: z.number(),
  npc_kills: z.number(),
  pod_kills: z.number(),
  ship_kills: z.number(),
});

const IdNameSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
});

export const BulkIdResultSchema = z.looseObject({
  agents: z.array(IdNameSchema).optional(),
  alliances: z.array(IdNameSchema).optional(),
  characters: z.array(IdNameSchema).optional(),
  constellations: z.array(IdNameSchema).optional(),
  corporations: z.array(IdNameSchema).optional(),
  factions: z.array(IdNameSchema).optional(),
  inventory_types: z.array(IdNameSchema).optional(),
  regions: z.array(IdNameSchema).optional(),
  systems: z.array(IdNameSchema).optional(),
  stations: z.array(IdNameSchema).optional(),
});

export const NameAndCategorySchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  category: z.enum([
    'alliance',
    'character',
    'constellation',
    'corporation',
    'inventory_type',
    'region',
    'solar_system',
    'station',
    'faction',
  ]),
});

export const SchematicInfoSchema = z.looseObject({
  schematic_name: z.string(),
  cycle_time: z.number(),
});

export const SearchResultSchema = z.looseObject({
  agent: z.array(z.number()).optional(),
  alliance: z.array(z.number()).optional(),
  character: z.array(z.number()).optional(),
  constellation: z.array(z.number()).optional(),
  corporation: z.array(z.number()).optional(),
  faction: z.array(z.number()).optional(),
  inventory_type: z.array(z.number()).optional(),
  region: z.array(z.number()).optional(),
  solar_system: z.array(z.number()).optional(),
  station: z.array(z.number()).optional(),
  structure: z.array(z.number()).optional(),
});
