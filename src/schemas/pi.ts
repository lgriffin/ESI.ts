import { z } from 'zod';

export const PlanetaryColonySchema = z.looseObject({
  solar_system_id: z.number(),
  planet_id: z.number(),
  planet_type: z.enum([
    'temperate',
    'barren',
    'oceanic',
    'ice',
    'gas',
    'lava',
    'storm',
    'plasma',
  ]),
  owner_id: z.number(),
  last_update: z.string(),
  upgrade_level: z.number(),
  num_pins: z.number(),
});

export const CustomsOfficeSchema = z.looseObject({
  office_id: z.number(),
  system_id: z.number(),
  reinforce_exit_start: z.number(),
  reinforce_exit_end: z.number(),
  alliance_tax_rate: z.number().optional(),
  corporation_tax_rate: z.number().optional(),
  standing_level: z.string().optional(),
  terrible_standing_tax_rate: z.number().optional(),
  bad_standing_tax_rate: z.number().optional(),
  neutral_standing_tax_rate: z.number().optional(),
  good_standing_tax_rate: z.number().optional(),
  excellent_standing_tax_rate: z.number().optional(),
});

export const ColonyLayoutSchema = z.looseObject({
  links: z.array(
    z.looseObject({
      source_pin_id: z.number(),
      destination_pin_id: z.number(),
      link_level: z.number(),
    }),
  ),
  pins: z.array(
    z.looseObject({
      pin_id: z.number(),
      type_id: z.number(),
      latitude: z.number(),
      longitude: z.number(),
      schematic_id: z.number().optional(),
      extractor_details: z
        .looseObject({
          heads: z.array(
            z.looseObject({
              head_id: z.number(),
              latitude: z.number(),
              longitude: z.number(),
            }),
          ),
          product_type_id: z.number().optional(),
          cycle_time: z.number().optional(),
          head_radius: z.number().optional(),
          qty_per_cycle: z.number().optional(),
        })
        .optional(),
      factory_details: z
        .looseObject({
          schematic_id: z.number(),
        })
        .optional(),
      contents: z
        .array(
          z.looseObject({
            type_id: z.number(),
            amount: z.number(),
          }),
        )
        .optional(),
      install_time: z.string().optional(),
      expiry_time: z.string().optional(),
      last_cycle_start: z.string().optional(),
    }),
  ),
  routes: z.array(
    z.looseObject({
      route_id: z.number(),
      source_pin_id: z.number(),
      destination_pin_id: z.number(),
      content_type_id: z.number(),
      quantity: z.number(),
      waypoints: z.array(z.number()).optional(),
    }),
  ),
});
