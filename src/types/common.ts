import { z } from 'zod';
import { RateLimitMetaSchema, EsiResponseMetaSchema } from '../schemas/common';
import type { EsiError } from '../core/util/error';

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type RateLimitMeta = z.infer<typeof RateLimitMetaSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type EsiResponseMeta = z.infer<typeof EsiResponseMetaSchema>;

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export interface EsiResponse<T> {
  data: T;
  meta: EsiResponseMeta;
}

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type EsiResult<T> =
  | { ok: true; data: T; meta: EsiResponseMeta }
  | { ok: false; error: EsiError; meta?: EsiResponseMeta };
