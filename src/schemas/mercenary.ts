import { z } from 'zod';

export const MercenaryDenSchema = z.looseObject({
  den_id: z.number(),
  system_id: z.number(),
  constellation_id: z.number(),
  region_id: z.number(),
  development_level: z.number().optional(),
  anarchy_level: z.number().optional(),
  active_operations: z.number().optional(),
});

export const MercenaryTacticalOperationSchema = z.looseObject({
  operation_id: z.number(),
  den_id: z.number(),
  system_id: z.number(),
  site_type: z.string(),
  status: z.enum(['spawning', 'active', 'completed', 'expired']),
  started_at: z.string().optional(),
  expires_at: z.string().optional(),
});
