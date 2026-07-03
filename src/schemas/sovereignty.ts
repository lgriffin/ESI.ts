import { z } from 'zod';

export const SovereigntyCampaignSchema = z.looseObject({
  campaign_id: z.number(),
  structure_id: z.number(),
  solar_system_id: z.number(),
  constellation_id: z.number(),
  event_type: z.enum([
    'tcu_defense',
    'ihub_defense',
    'station_defense',
    'station_freeport',
  ]),
  start_time: z.string(),
  defender_id: z.number().optional(),
  defender_score: z.number().optional(),
  attackers_score: z.number().optional(),
  participants: z
    .array(
      z.looseObject({
        alliance_id: z.number(),
        score: z.number(),
      }),
    )
    .optional(),
});

export const SovereigntySystemStructureSchema = z.looseObject({
  structure_id: z.number(),
  structure_type_id: z.number(),
  vulnerability_occupancy_level: z.number().optional(),
  vulnerable_start_time: z.string().optional(),
  vulnerable_end_time: z.string().optional(),
});

export const SovereigntySystemSchema = z.looseObject({
  system_id: z.number(),
  alliance_id: z.number().optional(),
  corporation_id: z.number().optional(),
  faction_id: z.number().optional(),
  military_index: z.number().optional(),
  industry_index: z.number().optional(),
  strategic_index: z.number().optional(),
  structures: z.array(SovereigntySystemStructureSchema).optional(),
});
