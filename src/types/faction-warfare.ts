import { z } from 'zod';
import {
  FactionWarfareStatsSchema,
  FactionWarfareCharacterStatsSchema,
  FactionWarfareSystemSchema,
  FactionWarfareWarSchema,
  // eslint-disable-next-line sonarjs/deprecation -- the deprecated type below is kept until the next major release
  FactionWarfareLeaderboardSchema,
  FactionWarfareFactionLeaderboardSchema,
  FactionWarfareCharacterLeaderboardSchema,
  FactionWarfareCorporationLeaderboardSchema,
  FactionWarfareCorporationStatsSchema,
} from '../schemas/faction-warfare';

export type FactionWarfareStats = z.infer<typeof FactionWarfareStatsSchema>;
export type FactionWarfareCharacterStats = z.infer<
  typeof FactionWarfareCharacterStatsSchema
>;
export type FactionWarfareSystem = z.infer<typeof FactionWarfareSystemSchema>;
export type FactionWarfareWar = z.infer<typeof FactionWarfareWarSchema>;
/**
 * @deprecated Use FactionWarfareFactionLeaderboard,
 * FactionWarfareCharacterLeaderboard or FactionWarfareCorporationLeaderboard.
 * Each of those is assignable to this type.
 */
export type FactionWarfareLeaderboard = z.infer<
  // eslint-disable-next-line sonarjs/deprecation -- see the import above
  typeof FactionWarfareLeaderboardSchema
>;
export type FactionWarfareFactionLeaderboard = z.infer<
  typeof FactionWarfareFactionLeaderboardSchema
>;
export type FactionWarfareCharacterLeaderboard = z.infer<
  typeof FactionWarfareCharacterLeaderboardSchema
>;
export type FactionWarfareCorporationLeaderboard = z.infer<
  typeof FactionWarfareCorporationLeaderboardSchema
>;
export type FactionWarfareCorporationStats = z.infer<
  typeof FactionWarfareCorporationStatsSchema
>;
