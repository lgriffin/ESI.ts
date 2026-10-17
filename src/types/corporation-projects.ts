import { z } from 'zod';
import {
  CorporationProjectCursorSchema,
  CorporationProjectSummarySchema,
  CorporationProjectsListingSchema,
  CorporationProjectSchema,
  CorporationProjectContributionSchema,
  CorporationProjectContributorSchema,
  CorporationProjectContributorsListingSchema,
} from '../schemas/corporation-projects';

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationProjectCursor = z.infer<
  typeof CorporationProjectCursorSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationProjectSummary = z.infer<
  typeof CorporationProjectSummarySchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationProjectsListing = z.infer<
  typeof CorporationProjectsListingSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationProject = z.infer<typeof CorporationProjectSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationProjectContribution = z.infer<
  typeof CorporationProjectContributionSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationProjectContributor = z.infer<
  typeof CorporationProjectContributorSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationProjectContributorsListing = z.infer<
  typeof CorporationProjectContributorsListingSchema
>;
