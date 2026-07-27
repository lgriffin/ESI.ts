 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: 68191d093493

import { z } from 'zod';

export const AllianceDetailSchema = z.looseObject({
  creator_corporation_id: z.number(),
  creator_id: z.number(),
  date_founded: z.string(),
  executor_corporation_id: z.number().optional(),
  faction_id: z.number().optional(),
  name: z.string(),
  ticker: z.string(),
});

export const AlliancesAllianceIdIconsGetSchema = z.looseObject({
  px128x128: z.string().optional(),
  px64x64: z.string().optional(),
});
