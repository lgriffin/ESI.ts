import { z } from 'zod';
import { esiEnum } from './esiEnum';

export const AccessListEntrySchema = z.looseObject({
  entity_id: z.number(),
  entity_type: esiEnum(['character', 'corporation', 'alliance']),
  access_type: esiEnum(['allowed', 'blocked']),
});

export const AccessListSchema = z.looseObject({
  access_list_id: z.number(),
  name: z.string(),
  entries: z.array(AccessListEntrySchema),
});
