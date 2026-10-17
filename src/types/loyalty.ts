import { z } from 'zod';
import {
  LoyaltyPointsSchema,
  LoyaltyStoreOfferSchema,
} from '../schemas/loyalty';

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type LoyaltyPoints = z.infer<typeof LoyaltyPointsSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type LoyaltyStoreOffer = z.infer<typeof LoyaltyStoreOfferSchema>;
