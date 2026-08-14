import { z } from 'zod';
import {
  MetaChangelogSchema,
  MetaChangelogEntrySchema,
  MetaCompatibilityDatesSchema,
  MetaNameSchema,
  MetaStatusSchema,
} from '../schemas/meta';

export type MetaChangelog = z.infer<typeof MetaChangelogSchema>;
export type MetaChangelogEntry = z.infer<typeof MetaChangelogEntrySchema>;
export type MetaCompatibilityDates = z.infer<
  typeof MetaCompatibilityDatesSchema
>;
export type MetaName = z.infer<typeof MetaNameSchema>;
export type MetaStatus = z.infer<typeof MetaStatusSchema>;
