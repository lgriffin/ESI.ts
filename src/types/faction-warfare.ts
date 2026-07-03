import { z } from 'zod';
import {
  FactionWarfareStatsSchema,
  FactionWarfareCharacterStatsSchema,
  FactionWarfareSystemSchema,
  FactionWarfareWarSchema,
  FactionWarfareLeaderboardSchema,
  FactionWarfareCorporationStatsSchema,
} from '../schemas/faction-warfare';

export type FactionWarfareStats = z.infer<typeof FactionWarfareStatsSchema>;
export type FactionWarfareCharacterStats = z.infer<
  typeof FactionWarfareCharacterStatsSchema
>;
export type FactionWarfareSystem = z.infer<typeof FactionWarfareSystemSchema>;
export type FactionWarfareWar = z.infer<typeof FactionWarfareWarSchema>;
export type FactionWarfareLeaderboard = z.infer<
  typeof FactionWarfareLeaderboardSchema
>;
export type FactionWarfareCorporationStats = z.infer<
  typeof FactionWarfareCorporationStatsSchema
>;
