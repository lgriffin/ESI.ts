import { z } from 'zod';
import {
  MercenaryDenSchema,
  MercenaryDensResponseSchema,
  MercenaryTacticalOperationSchema,
  MercenaryTacticalOperationsResponseSchema,
  MercenaryDenDetailSchema,
  MercenaryTacticalOperationDetailSchema,
} from '../schemas/mercenary';

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type MercenaryDen = z.infer<typeof MercenaryDenSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type MercenaryTacticalOperation = z.infer<
  typeof MercenaryTacticalOperationSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type MercenaryDensResponse = z.infer<typeof MercenaryDensResponseSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type MercenaryTacticalOperationsResponse = z.infer<
  typeof MercenaryTacticalOperationsResponseSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type MercenaryDenDetail = z.infer<typeof MercenaryDenDetailSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type MercenaryTacticalOperationDetail = z.infer<
  typeof MercenaryTacticalOperationDetailSchema
>;
