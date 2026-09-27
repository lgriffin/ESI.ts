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

/** One past ESI name, from `history` in `GET /meta/name`. */
const MetaNameHistorySchema = z.looseObject({
  date: z.string(),
  name: z.string(),
});

/** `GET /meta/name`: the current ESI name and the names it had before. */
export const MetaNameSchema = z.looseObject({
  current: z.string(),
  history: z.array(MetaNameHistorySchema),
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
