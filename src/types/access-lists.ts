import { z } from 'zod';
import {
  AccessListEntrySchema,
  AccessListSchema,
} from '../schemas/access-lists';

export type AccessListEntry = z.infer<typeof AccessListEntrySchema>;
export type AccessList = z.infer<typeof AccessListSchema>;
