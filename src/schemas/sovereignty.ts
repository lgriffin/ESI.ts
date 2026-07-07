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

const SovereigntyVulnerabilityWindowSchema = z.looseObject({
  start: z.string(),
  end: z.string(),
});

const SovereigntyHubSchema = z.looseObject({
  id: z.number(),
  vulnerability_window: SovereigntyVulnerabilityWindowSchema.optional(),
});

const SovereigntyDevelopmentSchema = z.looseObject({
  activity_defense_multiplier: z.number().optional(),
  military_level: z.number().optional(),
  industrial_level: z.number().optional(),
  strategic_level: z.number().optional(),
});

const SovereigntyAllianceClaimSchema = z.looseObject({
  alliance_id: z.number(),
  corporation_id: z.number().optional(),
  claimed_since: z.string().optional(),
  sovereignty_hub: SovereigntyHubSchema.optional(),
  is_capital_system: z.boolean().optional(),
  development: SovereigntyDevelopmentSchema.optional(),
});

const SovereigntyFactionClaimSchema = z.looseObject({
  faction_id: z.number(),
});

const SovereigntyClaimSchema = z.looseObject({
  alliance: SovereigntyAllianceClaimSchema.optional(),
  faction: SovereigntyFactionClaimSchema.optional(),
  unclaimed: z.boolean().optional(),
});

const SovereigntySystemEntrySchema = z.looseObject({
  solar_system_id: z.number(),
  claim: SovereigntyClaimSchema,
});

export const SovereigntySystemSchema = z.looseObject({
  solar_systems: z.array(SovereigntySystemEntrySchema),
});
