import { z } from 'zod';

export const MetaChangelogEntrySchema = z.looseObject({
  method: z.string(),
  path: z.string(),
  compatibility_date: z.string(),
  is_breaking: z.boolean(),
  description: z.string(),
});

export const MetaChangelogSchema = z.record(
  z.string(),
  z.array(MetaChangelogEntrySchema),
);

export const MetaCompatibilityDatesSchema = z.looseObject({
  compatibility_dates: z.array(z.string()),
});

export const MetaNameSchema = z.looseObject({
  name: z.string(),
});

export const MetaStatusSchema = z.looseObject({
  status: z.string(),
});
