 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: a0ec73787c55

import { z } from 'zod';

export const CharactersCharacterIdIndustryJobsGetSchema = z.looseObject({
  activity_id: z.number(),
  blueprint_id: z.number(),
  blueprint_location_id: z.number(),
  blueprint_type_id: z.number(),
  completed_character_id: z.number().optional(),
  completed_date: z.string().optional(),
  cost: z.number().optional(),
  duration: z.number(),
  end_date: z.string(),
  facility_id: z.number(),
  installer_id: z.number(),
  job_id: z.number(),
  licensed_runs: z.number().optional(),
  output_location_id: z.number(),
  pause_date: z.string().optional(),
  probability: z.number().optional(),
  product_type_id: z.number().optional(),
  runs: z.number(),
  start_date: z.string(),
  station_id: z.number(),
  status: z.enum(['active', 'cancelled', 'delivered', 'paused', 'ready', 'reverted']),
  successful_runs: z.number().optional(),
});

export const CharactersCharacterIdMiningGetSchema = z.looseObject({
  date: z.string(),
  quantity: z.number(),
  solar_system_id: z.number(),
  type_id: z.number(),
});

export const CorporationCorporationIdMiningExtractionsGetSchema = z.looseObject({
  chunk_arrival_time: z.string(),
  extraction_start_time: z.string(),
  moon_id: z.number(),
  natural_decay_time: z.string(),
  structure_id: z.number(),
});

export const CorporationCorporationIdMiningObserversGetSchema = z.looseObject({
  last_updated: z.string(),
  observer_id: z.number(),
  observer_type: z.enum(['structure']),
});

export const CorporationCorporationIdMiningObserversObserverIdGetSchema = z.looseObject({
  character_id: z.number(),
  last_updated: z.string(),
  quantity: z.number(),
  recorded_corporation_id: z.number(),
  type_id: z.number(),
});

export const CorporationsCorporationIdIndustryJobsGetSchema = z.looseObject({
  activity_id: z.number(),
  blueprint_id: z.number(),
  blueprint_location_id: z.number(),
  blueprint_type_id: z.number(),
  completed_character_id: z.number().optional(),
  completed_date: z.string().optional(),
  cost: z.number().optional(),
  duration: z.number(),
  end_date: z.string(),
  facility_id: z.number(),
  installer_id: z.number(),
  job_id: z.number(),
  licensed_runs: z.number().optional(),
  location_id: z.number(),
  output_location_id: z.number(),
  pause_date: z.string().optional(),
  probability: z.number().optional(),
  product_type_id: z.number().optional(),
  runs: z.number(),
  start_date: z.string(),
  status: z.enum(['active', 'cancelled', 'delivered', 'paused', 'ready', 'reverted']),
  successful_runs: z.number().optional(),
});

export const IndustryFacilitiesGetSchema = z.looseObject({
  facility_id: z.number(),
  owner_id: z.number(),
  region_id: z.number(),
  solar_system_id: z.number(),
  tax: z.number().optional(),
  type_id: z.number(),
});

export const IndustrySystemsGetSchema = z.looseObject({
  cost_indices: z.array(z.looseObject({
    activity: z.enum(['copying', 'duplicating', 'invention', 'manufacturing', 'none', 'reaction', 'researching_material_efficiency', 'researching_technology', 'researching_time_efficiency', 'reverse_engineering']),
    cost_index: z.number(),
  })),
  solar_system_id: z.number(),
});
