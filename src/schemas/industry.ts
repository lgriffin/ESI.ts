import { z } from 'zod';

export const IndustryJobSchema = z.looseObject({
  job_id: z.number(),
  installer_id: z.number(),
  facility_id: z.number(),
  station_id: z.number(),
  activity_id: z.number(),
  blueprint_id: z.number(),
  blueprint_type_id: z.number(),
  blueprint_location_id: z.number(),
  output_location_id: z.number(),
  runs: z.number(),
  cost: z.number().optional(),
  licensed_runs: z.number().optional(),
  probability: z.number().optional(),
  product_type_id: z.number().optional(),
  status: z.enum([
    'active',
    'cancelled',
    'delivered',
    'paused',
    'ready',
    'reverted',
  ]),
  duration: z.number(),
  start_date: z.string(),
  end_date: z.string(),
  pause_date: z.string().optional(),
  completed_date: z.string().optional(),
  completed_character_id: z.number().optional(),
  successful_runs: z.number().optional(),
});

export const MiningLedgerEntrySchema = z.looseObject({
  date: z.string(),
  solar_system_id: z.number(),
  type_id: z.number(),
  quantity: z.number(),
});

export const IndustryFacilitySchema = z.looseObject({
  facility_id: z.number(),
  owner_id: z.number(),
  region_id: z.number(),
  solar_system_id: z.number(),
  tax: z.number().optional(),
  type_id: z.number(),
});

export const IndustrySystemSchema = z.looseObject({
  solar_system_id: z.number(),
  cost_indices: z.array(
    z.looseObject({
      activity: z.string(),
      cost_index: z.number(),
    }),
  ),
});

export const MoonExtractionTimerSchema = z.looseObject({
  structure_id: z.number(),
  moon_id: z.number(),
  extraction_start_time: z.string(),
  chunk_arrival_time: z.string(),
  natural_decay_time: z.string(),
});

export const MiningObserverSchema = z.looseObject({
  observer_id: z.number(),
  observer_type: z.string(),
  last_updated: z.string(),
});

export const MiningObserverEntrySchema = z.looseObject({
  character_id: z.number(),
  recorded_corporation_id: z.number(),
  type_id: z.number(),
  quantity: z.number(),
  last_updated: z.string(),
});
