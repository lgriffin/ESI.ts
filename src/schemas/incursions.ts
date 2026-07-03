import { z } from 'zod';

export const IncursionSchema = z.looseObject({
  type: z.string(),
  state: z.enum(['withdrawing', 'mobilizing', 'established']),
  staging_solar_system_id: z.number(),
  constellation_id: z.number(),
  infested_solar_systems: z.array(z.number()),
  has_boss: z.boolean(),
  faction_id: z.number(),
  influence: z.number(),
});
