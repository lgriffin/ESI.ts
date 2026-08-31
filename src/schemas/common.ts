import { z } from 'zod';
import { esiEnum } from './esiEnum';

export const StandingSchema = z.looseObject({
  from_id: z.number(),
  from_type: esiEnum(['agent', 'npc_corp', 'faction']),
  standing: z.number(),
});

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
  etag: z.string().optional(),
  pages: z.number().optional(),
  expires: z.string().optional(),
  errorLimitRemain: z.number().optional(),
  errorLimitReset: z.number().optional(),
});

export function esiResponse<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    meta: EsiResponseMetaSchema,
  });
}
