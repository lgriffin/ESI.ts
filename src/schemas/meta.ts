import { z } from 'zod';
import { esiEnum } from './esiEnum';

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

/** One route's health in `GET /meta/status`. */
export const MetaRouteStatusSchema = z.looseObject({
  method: esiEnum(['GET', 'POST', 'PUT', 'DELETE']),
  path: z.string(),
  status: esiEnum(['Unknown', 'OK', 'Degraded', 'Down', 'Recovering']),
});

/** `GET /meta/status`: the health of each ESI route (MetaStatus). */
export const MetaStatusSchema = z.looseObject({
  routes: z.array(MetaRouteStatusSchema),
});
