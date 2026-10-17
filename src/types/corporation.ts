import { z } from 'zod';
import {
  CorporationInfoSchema,
  CorporationAllianceHistorySchema,
  CorporationMedalSchema,
  CorporationStarbaseSchema,
  CorporationDivisionsSchema,
  CorporationFacilitySchema,
  CorporationIssuedMedalSchema,
  CorporationMemberTitleSchema,
  CorporationMemberTrackingSchema,
  CorporationMemberRoleSchema,
  CorporationRoleHistorySchema,
  CorporationShareholderSchema,
  CorporationStarbaseDetailSchema,
  CorporationStructureSchema,
  CorporationTitleSchema,
  ContainerLogSchema,
} from '../schemas/corporation';

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationInfo = z.infer<typeof CorporationInfoSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationAllianceHistory = z.infer<
  typeof CorporationAllianceHistorySchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationMedal = z.infer<typeof CorporationMedalSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationStarbase = z.infer<typeof CorporationStarbaseSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationDivisions = z.infer<typeof CorporationDivisionsSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationFacility = z.infer<typeof CorporationFacilitySchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationIssuedMedal = z.infer<
  typeof CorporationIssuedMedalSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationMemberTitle = z.infer<
  typeof CorporationMemberTitleSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationMemberTracking = z.infer<
  typeof CorporationMemberTrackingSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationMemberRole = z.infer<typeof CorporationMemberRoleSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationRoleHistory = z.infer<
  typeof CorporationRoleHistorySchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationShareholder = z.infer<
  typeof CorporationShareholderSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationStarbaseDetail = z.infer<
  typeof CorporationStarbaseDetailSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationStructure = z.infer<typeof CorporationStructureSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationTitle = z.infer<typeof CorporationTitleSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type ContainerLog = z.infer<typeof ContainerLogSchema>;
