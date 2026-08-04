 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: a0ec73787c55

import { z } from 'zod';

export const StatusGetSchema = z.looseObject({
  players: z.number(),
  server_version: z.string(),
  start_time: z.string(),
  vip: z.boolean().optional(),
});
