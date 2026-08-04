 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: a0ec73787c55

import { z } from 'zod';

export const UniverseAncestriesGetSchema = z.looseObject({
  bloodline_id: z.number(),
  description: z.string(),
  icon_id: z.number().optional(),
  id: z.number(),
  name: z.string(),
  short_description: z.string().optional(),
});

export const UniverseAsteroidBeltsAsteroidBeltIdGetSchema = z.looseObject({
  name: z.string(),
  position: z.looseObject({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  system_id: z.number(),
});

export const UniverseBloodlinesGetSchema = z.looseObject({
  bloodline_id: z.number(),
  charisma: z.number(),
  corporation_id: z.number(),
  description: z.string(),
  intelligence: z.number(),
  memory: z.number(),
  name: z.string(),
  perception: z.number(),
  race_id: z.number(),
  ship_type_id: z.number(),
  willpower: z.number(),
});

export const UniverseCategoriesCategoryIdGetSchema = z.looseObject({
  category_id: z.number(),
  groups: z.array(z.number()),
  name: z.string(),
  published: z.boolean(),
});

export const UniverseConstellationsConstellationIdGetSchema = z.looseObject({
  constellation_id: z.number(),
  name: z.string(),
  position: z.looseObject({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  region_id: z.number(),
  systems: z.array(z.number()),
});

export const UniverseFactionsGetSchema = z.looseObject({
  corporation_id: z.number().optional(),
  description: z.string(),
  faction_id: z.number(),
  is_unique: z.boolean(),
  militia_corporation_id: z.number().optional(),
  name: z.string(),
  size_factor: z.number(),
  solar_system_id: z.number().optional(),
  station_count: z.number(),
  station_system_count: z.number(),
});

export const UniverseGraphicsGraphicIdGetSchema = z.looseObject({
  collision_file: z.string().optional(),
  graphic_file: z.string().optional(),
  graphic_id: z.number(),
  icon_folder: z.string().optional(),
  sof_dna: z.string().optional(),
  sof_fation_name: z.string().optional(),
  sof_hull_name: z.string().optional(),
  sof_race_name: z.string().optional(),
});

export const UniverseGroupsGroupIdGetSchema = z.looseObject({
  category_id: z.number(),
  group_id: z.number(),
  name: z.string(),
  published: z.boolean(),
  types: z.array(z.number()),
});

export const UniverseIdsPostSchema = z.looseObject({
  agents: z.array(z.looseObject({
    id: z.number().optional(),
    name: z.string().optional(),
  })).optional(),
  alliances: z.array(z.looseObject({
    id: z.number().optional(),
    name: z.string().optional(),
  })).optional(),
  characters: z.array(z.looseObject({
    id: z.number().optional(),
    name: z.string().optional(),
  })).optional(),
  constellations: z.array(z.looseObject({
    id: z.number().optional(),
    name: z.string().optional(),
  })).optional(),
  corporations: z.array(z.looseObject({
    id: z.number().optional(),
    name: z.string().optional(),
  })).optional(),
  factions: z.array(z.looseObject({
    id: z.number().optional(),
    name: z.string().optional(),
  })).optional(),
  inventory_types: z.array(z.looseObject({
    id: z.number().optional(),
    name: z.string().optional(),
  })).optional(),
  regions: z.array(z.looseObject({
    id: z.number().optional(),
    name: z.string().optional(),
  })).optional(),
  stations: z.array(z.looseObject({
    id: z.number().optional(),
    name: z.string().optional(),
  })).optional(),
  systems: z.array(z.looseObject({
    id: z.number().optional(),
    name: z.string().optional(),
  })).optional(),
});

export const UniverseMoonsMoonIdGetSchema = z.looseObject({
  moon_id: z.number(),
  name: z.string(),
  position: z.looseObject({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  system_id: z.number(),
});

export const UniverseNamesPostSchema = z.looseObject({
  category: z.enum(['alliance', 'character', 'constellation', 'corporation', 'inventory_type', 'region', 'solar_system', 'station', 'faction']),
  id: z.number(),
  name: z.string(),
});

export const UniversePlanetsPlanetIdGetSchema = z.looseObject({
  name: z.string(),
  planet_id: z.number(),
  position: z.looseObject({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  system_id: z.number(),
  type_id: z.number(),
});

export const UniverseRacesGetSchema = z.looseObject({
  alliance_id: z.number(),
  description: z.string(),
  name: z.string(),
  race_id: z.number(),
});

export const UniverseRegionsRegionIdGetSchema = z.looseObject({
  constellations: z.array(z.number()),
  description: z.string().optional(),
  name: z.string(),
  region_id: z.number(),
});

export const UniverseStargatesStargateIdGetSchema = z.looseObject({
  destination: z.looseObject({
    stargate_id: z.number(),
    system_id: z.number(),
  }),
  name: z.string(),
  position: z.looseObject({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  stargate_id: z.number(),
  system_id: z.number(),
  type_id: z.number(),
});

export const UniverseStarsStarIdGetSchema = z.looseObject({
  age: z.number(),
  luminosity: z.number(),
  name: z.string(),
  radius: z.number(),
  solar_system_id: z.number(),
  spectral_class: z.enum(['K2 V', 'K4 V', 'G2 V', 'G8 V', 'M7 V', 'K7 V', 'M2 V', 'K5 V', 'M3 V', 'G0 V', 'G7 V', 'G3 V', 'F9 V', 'G5 V', 'F6 V', 'K8 V', 'K9 V', 'K6 V', 'G9 V', 'G6 V', 'G4 VI', 'G4 V', 'F8 V', 'F2 V', 'F1 V', 'K3 V', 'F0 VI', 'G1 VI', 'G0 VI', 'K1 V', 'M4 V', 'M1 V', 'M6 V', 'M0 V', 'K2 IV', 'G2 VI', 'K0 V', 'K5 IV', 'F5 VI', 'G6 VI', 'F6 VI', 'F2 IV', 'G3 VI', 'M8 V', 'F1 VI', 'K1 IV', 'F7 V', 'G5 VI', 'M5 V', 'G7 VI', 'F5 V', 'F4 VI', 'F8 VI', 'K3 IV', 'F4 IV', 'F0 V', 'G7 IV', 'G8 VI', 'F2 VI', 'F4 V', 'F7 VI', 'F3 V', 'G1 V', 'G9 VI', 'F3 IV', 'F9 VI', 'M9 V', 'K0 IV', 'F1 IV', 'G4 IV', 'F3 VI', 'K4 IV', 'G5 IV', 'G3 IV', 'G1 IV', 'K7 IV', 'G0 IV', 'K6 IV', 'K9 IV', 'G2 IV', 'F9 IV', 'F0 IV', 'K8 IV', 'G8 IV', 'F6 IV', 'F5 IV', 'A0', 'A0IV', 'A0IV2']),
  temperature: z.number(),
  type_id: z.number(),
});

export const UniverseStationsStationIdGetSchema = z.looseObject({
  max_dockable_ship_volume: z.number(),
  name: z.string(),
  office_rental_cost: z.number(),
  owner: z.number().optional(),
  position: z.looseObject({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  race_id: z.number().optional(),
  reprocessing_efficiency: z.number(),
  reprocessing_stations_take: z.number(),
  services: z.array(z.enum(['bounty-missions', 'assasination-missions', 'courier-missions', 'interbus', 'reprocessing-plant', 'refinery', 'market', 'black-market', 'stock-exchange', 'cloning', 'surgery', 'dna-therapy', 'repair-facilities', 'factory', 'labratory', 'gambling', 'fitting', 'paintshop', 'news', 'storage', 'insurance', 'docking', 'office-rental', 'jump-clone-facility', 'loyalty-point-store', 'navy-offices', 'security-offices'])),
  station_id: z.number(),
  system_id: z.number(),
  type_id: z.number(),
});

export const UniverseStructuresStructureIdGetSchema = z.looseObject({
  name: z.string(),
  owner_id: z.number(),
  position: z.looseObject({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }).optional(),
  solar_system_id: z.number(),
  type_id: z.number().optional(),
});

export const UniverseSystemJumpsGetSchema = z.looseObject({
  ship_jumps: z.number(),
  system_id: z.number(),
});

export const UniverseSystemKillsGetSchema = z.looseObject({
  npc_kills: z.number(),
  pod_kills: z.number(),
  ship_kills: z.number(),
  system_id: z.number(),
});

export const UniverseSystemsSystemIdGetSchema = z.looseObject({
  constellation_id: z.number(),
  name: z.string(),
  planets: z.array(z.looseObject({
    asteroid_belts: z.array(z.number()).optional(),
    moons: z.array(z.number()).optional(),
    planet_id: z.number(),
  })).optional(),
  position: z.looseObject({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  security_class: z.string().optional(),
  security_status: z.number(),
  star_id: z.number().optional(),
  stargates: z.array(z.number()).optional(),
  stations: z.array(z.number()).optional(),
  system_id: z.number(),
});

export const UniverseTypesTypeIdGetSchema = z.looseObject({
  capacity: z.number().optional(),
  description: z.string(),
  dogma_attributes: z.array(z.looseObject({
    attribute_id: z.number(),
    value: z.number(),
  })).optional(),
  dogma_effects: z.array(z.looseObject({
    effect_id: z.number(),
    is_default: z.boolean(),
  })).optional(),
  graphic_id: z.number().optional(),
  group_id: z.number(),
  icon_id: z.number().optional(),
  market_group_id: z.number().optional(),
  mass: z.number().optional(),
  name: z.string(),
  packaged_volume: z.number().optional(),
  portion_size: z.number().optional(),
  published: z.boolean(),
  radius: z.number().optional(),
  type_id: z.number(),
  volume: z.number().optional(),
});
