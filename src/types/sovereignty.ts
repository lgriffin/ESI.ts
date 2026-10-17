import { z } from 'zod';
import {
  SovereigntyCampaignSchema,
  SovereigntySystemStructureSchema,
  SovereigntySystemSchema,
} from '../schemas/sovereignty';

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type SovereigntyCampaign = z.infer<typeof SovereigntyCampaignSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type SovereigntySystemStructure = z.infer<
  typeof SovereigntySystemStructureSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type SovereigntySystem = z.infer<typeof SovereigntySystemSchema>;
