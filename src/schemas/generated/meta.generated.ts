 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: 68191d093493

import { z } from 'zod';

export const MetaChangelogSchema = z.looseObject({
  changelog: z.record(z.string(), z.unknown()),
});

export const MetaCompatibilityDatesSchema = z.looseObject({
  compatibility_dates: z.array(z.string()),
});

export const MetaStatusSchema = z.looseObject({
  routes: z.array(z.looseObject({
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
    path: z.string(),
    status: z.enum(['Unknown', 'OK', 'Degraded', 'Down', 'Recovering']),
  })),
});
