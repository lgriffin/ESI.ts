import { z } from 'zod';

export const WarSchema = z.looseObject({
  id: z.number(),
  declared: z.string(),
  started: z.string().optional(),
  finished: z.string().optional(),
  retracted: z.string().optional(),
  mutual: z.boolean(),
  open_for_allies: z.boolean(),
  aggressor: z.looseObject({
    corporation_id: z.number().optional(),
    alliance_id: z.number().optional(),
    isk_destroyed: z.number(),
    ships_killed: z.number(),
  }),
  defender: z.looseObject({
    corporation_id: z.number().optional(),
    alliance_id: z.number().optional(),
    isk_destroyed: z.number(),
    ships_killed: z.number(),
  }),
  allies: z
    .array(
      z.looseObject({
        corporation_id: z.number().optional(),
        alliance_id: z.number().optional(),
      }),
    )
    .optional(),
});
