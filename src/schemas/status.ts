import { z } from 'zod';

export const ServerStatusSchema = z.looseObject({
  players: z.number(),
  server_version: z.string(),
  start_time: z.string(),
  vip: z.boolean().optional(),
});
