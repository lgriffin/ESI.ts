import { z } from 'zod';
import { RateLimitMetaSchema, EsiResponseMetaSchema } from '../schemas/common';

export type RateLimitMeta = z.infer<typeof RateLimitMetaSchema>;
export type EsiResponseMeta = z.infer<typeof EsiResponseMetaSchema>;

export interface EsiResponse<T> {
  data: T;
  meta: EsiResponseMeta;
}
