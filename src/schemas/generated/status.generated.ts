 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: 68191d093493

import { z } from 'zod';

export const StatusGetSchema = z.looseObject({
  players: z.number(),
  server_version: z.string(),
  start_time: z.string(),
  vip: z.boolean().optional(),
});
