import { z } from 'zod';
import { RateLimitMetaSchema, EsiResponseMetaSchema } from '../schemas/common';
import type { EsiError } from '../core/util/error';

export type RateLimitMeta = z.infer<typeof RateLimitMetaSchema>;
export type EsiResponseMeta = z.infer<typeof EsiResponseMetaSchema>;

export interface EsiResponse<T> {
  data: T;
  meta: EsiResponseMeta;
}

export type EsiResult<T> =
  | { ok: true; data: T; meta: EsiResponseMeta }
  | { ok: false; error: EsiError; meta?: EsiResponseMeta };
