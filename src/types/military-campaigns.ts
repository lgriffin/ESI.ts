import { z } from 'zod';
import {
  MilitaryCampaignSchema,
  MilitaryCampaignsResponseSchema,
  MilitaryCampaignObjectiveSchema,
  MilitaryCampaignObjectivesResponseSchema,
  CharacterMilitaryCampaignObjectiveSchema,
  CharacterMilitaryCampaignObjectivesResponseSchema,
} from '../schemas/military-campaigns';

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type MilitaryCampaign = z.infer<typeof MilitaryCampaignSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type MilitaryCampaignsResponse = z.infer<
  typeof MilitaryCampaignsResponseSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type MilitaryCampaignObjective = z.infer<
  typeof MilitaryCampaignObjectiveSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type MilitaryCampaignObjectivesResponse = z.infer<
  typeof MilitaryCampaignObjectivesResponseSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CharacterMilitaryCampaignObjective = z.infer<
  typeof CharacterMilitaryCampaignObjectiveSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type CharacterMilitaryCampaignObjectivesResponse = z.infer<
  typeof CharacterMilitaryCampaignObjectivesResponseSchema
>;
