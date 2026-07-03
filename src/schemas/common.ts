import { z } from 'zod';

export const RateLimitMetaSchema = z.object({
  remaining: z.number(),
  limit: z.number(),
  used: z.number(),
  group: z.string().nullable(),
});

export const EsiResponseMetaSchema = z.looseObject({
  headers: z.record(z.string(), z.string()),
  fromCache: z.boolean(),
  stale: z.boolean(),
  cacheHitType: z.enum(['spec-ttl', 'etag-304', 'stale-on-error']).optional(),
  warning: z
    .object({
      code: z.number(),
      message: z.string(),
    })
    .optional(),
  requestId: z.string().optional(),
  date: z.string().optional(),
  contentLanguage: z.string().optional(),
  rateLimit: RateLimitMetaSchema.optional(),
  responseTimeMs: z.number().optional(),
});

export function esiResponse<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    meta: EsiResponseMetaSchema,
  });
}
