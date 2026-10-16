import { z } from 'zod';
import {
  ParagonHubSkinrListingSchema,
  ParagonHubCharacterListingSchema,
  ParagonHubSkinrResponseSchema,
  ParagonHubCharacterSkinrResponseSchema,
  ParagonHubCursorSchema,
} from '../schemas/paragon-hub';

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type ParagonHubSkinrListing = z.infer<
  typeof ParagonHubSkinrListingSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type ParagonHubCharacterListing = z.infer<
  typeof ParagonHubCharacterListingSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type ParagonHubSkinrResponse = z.infer<
  typeof ParagonHubSkinrResponseSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type ParagonHubCharacterSkinrResponse = z.infer<
  typeof ParagonHubCharacterSkinrResponseSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type ParagonHubCursor = z.infer<typeof ParagonHubCursorSchema>;
