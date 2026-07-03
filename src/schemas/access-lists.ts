import { z } from 'zod';

export const AccessListEntrySchema = z.looseObject({
  entity_id: z.number(),
  entity_type: z.enum(['character', 'corporation', 'alliance']),
  access_type: z.enum(['allowed', 'blocked']),
});

export const AccessListSchema = z.looseObject({
  access_list_id: z.number(),
  name: z.string(),
  entries: z.array(AccessListEntrySchema),
});
