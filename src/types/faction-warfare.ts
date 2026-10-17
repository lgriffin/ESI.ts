import { z } from 'zod';
import {
  FactionWarfareStatsSchema,
  FactionWarfareCharacterStatsSchema,
  FactionWarfareSystemSchema,
  FactionWarfareWarSchema,
  FactionWarfareLeaderboardSchema,
  FactionWarfareFactionLeaderboardSchema,
  FactionWarfareCharacterLeaderboardSchema,
  FactionWarfareCorporationLeaderboardSchema,
  FactionWarfareCorporationStatsSchema,
} from '../schemas/faction-warfare';

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type FactionWarfareStats = z.infer<typeof FactionWarfareStatsSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type FactionWarfareCharacterStats = z.infer<
  typeof FactionWarfareCharacterStatsSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type FactionWarfareSystem = z.infer<typeof FactionWarfareSystemSchema>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type FactionWarfareWar = z.infer<typeof FactionWarfareWarSchema>;
/**
 * @deprecated Use FactionWarfareFactionLeaderboard,
 * FactionWarfareCharacterLeaderboard or FactionWarfareCorporationLeaderboard.
 * Each of those is assignable to this type.
 */
export type FactionWarfareLeaderboard = z.infer<
  typeof FactionWarfareLeaderboardSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type FactionWarfareFactionLeaderboard = z.infer<
  typeof FactionWarfareFactionLeaderboardSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type FactionWarfareCharacterLeaderboard = z.infer<
  typeof FactionWarfareCharacterLeaderboardSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type FactionWarfareCorporationLeaderboard = z.infer<
  typeof FactionWarfareCorporationLeaderboardSchema
>;
/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type FactionWarfareCorporationStats = z.infer<
  typeof FactionWarfareCorporationStatsSchema
>;
