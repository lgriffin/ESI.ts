import { z } from 'zod';

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
  contested: z.enum(['captured', 'contested', 'uncontested', 'vulnerable']),
  victory_points: z.number(),
  victory_points_threshold: z.number(),
});

export const FactionWarfareWarSchema = z.looseObject({
  aggressor_id: z.number(),
  defender_id: z.number(),
});

export const FactionWarfareLeaderboardSchema = z.looseObject({
  kills: z.looseObject({
    yesterday: z.array(
      z.looseObject({
        amount: z.number(),
        id: z.number().optional(),
      }),
    ),
    last_week: z.array(
      z.looseObject({
        amount: z.number(),
        id: z.number().optional(),
      }),
    ),
    active_total: z.array(
      z.looseObject({
        amount: z.number(),
        id: z.number().optional(),
      }),
    ),
  }),
  victory_points: z.looseObject({
    yesterday: z.array(
      z.looseObject({
        amount: z.number(),
        id: z.number().optional(),
      }),
    ),
    last_week: z.array(
      z.looseObject({
        amount: z.number(),
        id: z.number().optional(),
      }),
    ),
    active_total: z.array(
      z.looseObject({
        amount: z.number(),
        id: z.number().optional(),
      }),
    ),
  }),
});

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
