 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: a0ec73787c55

import { z } from 'zod';

export const IncursionsGetSchema = z.looseObject({
  constellation_id: z.number(),
  faction_id: z.number(),
  has_boss: z.boolean(),
  infested_solar_systems: z.array(z.number()),
  influence: z.number(),
  staging_solar_system_id: z.number(),
  state: z.enum(['withdrawing', 'mobilizing', 'established']),
  type: z.string(),
});
