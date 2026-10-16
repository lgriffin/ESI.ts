import { z } from 'zod';
import {
  EsiCursorSchema,
  FreelanceJobSummarySchema,
  FreelanceJobsListingSchema,
  FreelanceJobDetailSchema,
  CharacterFreelanceJobsListingSchema,
  FreelanceJobParticipationSchema,
  CorporationFreelanceJobsListingSchema,
  FreelanceJobParticipantSchema,
  FreelanceJobParticipantsListingSchema,
} from '../schemas/freelance-jobs';

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type EsiCursor = z.infer<typeof EsiCursorSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type FreelanceJobSummary = z.infer<typeof FreelanceJobSummarySchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type FreelanceJobsListing = z.infer<typeof FreelanceJobsListingSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type FreelanceJobDetail = z.infer<typeof FreelanceJobDetailSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CharacterFreelanceJobsListing = z.infer<
  typeof CharacterFreelanceJobsListingSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type FreelanceJobParticipation = z.infer<
  typeof FreelanceJobParticipationSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CorporationFreelanceJobsListing = z.infer<
  typeof CorporationFreelanceJobsListingSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type FreelanceJobParticipant = z.infer<
  typeof FreelanceJobParticipantSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type FreelanceJobParticipantsListing = z.infer<
  typeof FreelanceJobParticipantsListingSchema
>;
