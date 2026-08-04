 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: a0ec73787c55

import { z } from 'zod';

export const CharactersCharacterIdPlanetsGetSchema = z.looseObject({
  last_update: z.string(),
  num_pins: z.number(),
  owner_id: z.number(),
  planet_id: z.number(),
  planet_type: z.enum(['temperate', 'barren', 'oceanic', 'ice', 'gas', 'lava', 'storm', 'plasma']),
  solar_system_id: z.number(),
  upgrade_level: z.number(),
});

export const CharactersCharacterIdPlanetsPlanetIdGetSchema = z.looseObject({
  links: z.array(z.looseObject({
    destination_pin_id: z.number(),
    link_level: z.number(),
    source_pin_id: z.number(),
  })),
  pins: z.array(z.looseObject({
    contents: z.array(z.looseObject({
      amount: z.number(),
      type_id: z.number(),
    })).optional(),
    expiry_time: z.string().optional(),
    extractor_details: z.looseObject({
      cycle_time: z.number().optional(),
      head_radius: z.number().optional(),
      heads: z.array(z.looseObject({
        head_id: z.number(),
        latitude: z.number(),
        longitude: z.number(),
      })),
      product_type_id: z.number().optional(),
      qty_per_cycle: z.number().optional(),
    }).optional(),
    factory_details: z.looseObject({
      schematic_id: z.number(),
    }).optional(),
    install_time: z.string().optional(),
    last_cycle_start: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    pin_id: z.number(),
    schematic_id: z.number().optional(),
    type_id: z.number(),
  })),
  routes: z.array(z.looseObject({
    content_type_id: z.number(),
    destination_pin_id: z.number(),
    quantity: z.number(),
    route_id: z.number(),
    source_pin_id: z.number(),
    waypoints: z.array(z.number()).optional(),
  })),
});

export const CorporationsCorporationIdCustomsOfficesGetSchema = z.looseObject({
  alliance_tax_rate: z.number().optional(),
  allow_access_with_standings: z.boolean(),
  allow_alliance_access: z.boolean(),
  bad_standing_tax_rate: z.number().optional(),
  corporation_tax_rate: z.number().optional(),
  excellent_standing_tax_rate: z.number().optional(),
  good_standing_tax_rate: z.number().optional(),
  neutral_standing_tax_rate: z.number().optional(),
  office_id: z.number(),
  reinforce_exit_end: z.number(),
  reinforce_exit_start: z.number(),
  standing_level: z.enum(['bad', 'excellent', 'good', 'neutral', 'terrible']).optional(),
  system_id: z.number(),
  terrible_standing_tax_rate: z.number().optional(),
  type_id: z.number().optional(),
});

export const UniverseSchematicsSchematicIdGetSchema = z.looseObject({
  cycle_time: z.number(),
  schematic_name: z.string(),
});
