import { z } from 'zod';
import { esiEnum } from './esiEnum';

export const FactionWarfareStatsSchema = z.looseObject({
  faction_id: z.number(),
  pilots: z.number(),
  systems_controlled: z.number(),
  kills: z.looseObject({
    yesterday: z.number(),
    last_week: z.number(),
    total: z.number(),
  }),
  victory_points: z.looseObject({
    yesterday: z.number(),
    last_week: z.number(),
    total: z.number(),
  }),
});

export const FactionWarfareCharacterStatsSchema = z.looseObject({
  faction_id: z.number().optional(),
  enlisted_on: z.string().optional(),
  current_rank: z.number().optional(),
  highest_rank: z.number().optional(),
  kills: z.looseObject({
    yesterday: z.number(),
    last_week: z.number(),
    total: z.number(),
  }),
  victory_points: z.looseObject({
    yesterday: z.number(),
    last_week: z.number(),
    total: z.number(),
  }),
});

export const FactionWarfareSystemSchema = z.looseObject({
  solar_system_id: z.number(),
  owner_faction_id: z.number(),
  occupier_faction_id: z.number(),
  contested: esiEnum(['captured', 'contested', 'uncontested', 'vulnerable']),
  victory_points: z.number(),
  victory_points_threshold: z.number(),
});

export const FactionWarfareWarSchema = z.looseObject({
  faction_id: z.number(),
  against_id: z.number(),
});

/**
 * The kills and victory_points envelope every faction warfare leaderboard
 * shares, around the entry shape of one board.
 */
function leaderboardSchema<Entry extends z.ZodType>(entry: Entry) {
  const rankings = z.looseObject({
    yesterday: z.array(entry),
    last_week: z.array(entry),
    active_total: z.array(entry),
  });
  return z.looseObject({ kills: rankings, victory_points: rankings });
}

/** `GET /fw/leaderboards`: the top factions. */
export const FactionWarfareFactionLeaderboardSchema = leaderboardSchema(
  z.looseObject({
    amount: z.number().optional(),
    faction_id: z.number().optional(),
  }),
);

/** `GET /fw/leaderboards/characters`: the top pilots. */
export const FactionWarfareCharacterLeaderboardSchema = leaderboardSchema(
  z.looseObject({
    amount: z.number().optional(),
    character_id: z.number().optional(),
  }),
);

/** `GET /fw/leaderboards/corporations`: the top corporations. */
export const FactionWarfareCorporationLeaderboardSchema = leaderboardSchema(
  z.looseObject({
    amount: z.number().optional(),
    corporation_id: z.number().optional(),
  }),
);

/**
 * An entry of any of the three leaderboards.
 *
 * @deprecated Use FactionWarfareFactionLeaderboardSchema,
 * FactionWarfareCharacterLeaderboardSchema or
 * FactionWarfareCorporationLeaderboardSchema, which name the one identity key
 * each board carries. No endpoint validates against this schema.
 */
export const FactionWarfareLeaderboardSchema = leaderboardSchema(
  z.looseObject({
    amount: z.number().optional(),
    faction_id: z.number().optional(),
    character_id: z.number().optional(),
    corporation_id: z.number().optional(),
  }),
);

export const FactionWarfareCorporationStatsSchema = z.looseObject({
  faction_id: z.number().optional(),
  enlisted_on: z.string().optional(),
  pilots: z.number().optional(),
  kills: z.looseObject({
    yesterday: z.number(),
    last_week: z.number(),
    total: z.number(),
  }),
  victory_points: z.looseObject({
    yesterday: z.number(),
    last_week: z.number(),
    total: z.number(),
  }),
});
