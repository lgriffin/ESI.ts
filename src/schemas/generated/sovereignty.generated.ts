 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: a0ec73787c55

import { z } from 'zod';

export const SovereigntyCampaignsGetSchema = z.looseObject({
  attackers_score: z.number().optional(),
  campaign_id: z.number(),
  constellation_id: z.number(),
  defender_id: z.number().optional(),
  defender_score: z.number().optional(),
  event_type: z.enum(['tcu_defense', 'ihub_defense', 'station_defense', 'station_freeport']),
  participants: z.array(z.looseObject({
    alliance_id: z.number(),
    score: z.number(),
  })).optional(),
  solar_system_id: z.number(),
  start_time: z.string(),
  structure_id: z.number(),
});

export const SovereigntyMapGetSchema = z.looseObject({
  alliance_id: z.number().optional(),
  corporation_id: z.number().optional(),
  faction_id: z.number().optional(),
  system_id: z.number(),
});

export const SovereigntyStructuresGetSchema = z.looseObject({
  alliance_id: z.number(),
  solar_system_id: z.number(),
  structure_id: z.number(),
  structure_type_id: z.number(),
  vulnerability_occupancy_level: z.number().optional(),
  vulnerable_end_time: z.string().optional(),
  vulnerable_start_time: z.string().optional(),
});
