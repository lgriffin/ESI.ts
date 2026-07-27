 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: 68191d093493

import { z } from 'zod';

export const WarsWarIdGetSchema = z.looseObject({
  aggressor: z.looseObject({
    alliance_id: z.number().optional(),
    corporation_id: z.number().optional(),
    isk_destroyed: z.number(),
    ships_killed: z.number(),
  }),
  allies: z.array(z.looseObject({
    alliance_id: z.number().optional(),
    corporation_id: z.number().optional(),
  })).optional(),
  declared: z.string(),
  defender: z.looseObject({
    alliance_id: z.number().optional(),
    corporation_id: z.number().optional(),
    isk_destroyed: z.number(),
    ships_killed: z.number(),
  }),
  finished: z.string().optional(),
  id: z.number(),
  mutual: z.boolean(),
  open_for_allies: z.boolean(),
  retracted: z.string().optional(),
  started: z.string().optional(),
});

export const WarsWarIdKillmailsGetSchema = z.looseObject({
  killmail_hash: z.string(),
  killmail_id: z.number(),
});
