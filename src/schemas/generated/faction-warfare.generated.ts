 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: a0ec73787c55

import { z } from 'zod';

export const CharactersCharacterIdFwStatsGetSchema = z.looseObject({
  current_rank: z.number().optional(),
  enlisted_on: z.string().optional(),
  faction_id: z.number().optional(),
  highest_rank: z.number().optional(),
  kills: z.looseObject({
    last_week: z.number(),
    total: z.number(),
    yesterday: z.number(),
  }),
  victory_points: z.looseObject({
    last_week: z.number(),
    total: z.number(),
    yesterday: z.number(),
  }),
});

export const CorporationsCorporationIdFwStatsGetSchema = z.looseObject({
  enlisted_on: z.string().optional(),
  faction_id: z.number().optional(),
  kills: z.looseObject({
    last_week: z.number(),
    total: z.number(),
    yesterday: z.number(),
  }),
  pilots: z.number().optional(),
  victory_points: z.looseObject({
    last_week: z.number(),
    total: z.number(),
    yesterday: z.number(),
  }),
});

export const FwLeaderboardsCharactersGetSchema = z.looseObject({
  kills: z.looseObject({
    active_total: z.array(z.looseObject({
      amount: z.number().optional(),
      character_id: z.number().optional(),
    })),
    last_week: z.array(z.looseObject({
      amount: z.number().optional(),
      character_id: z.number().optional(),
    })),
    yesterday: z.array(z.looseObject({
      amount: z.number().optional(),
      character_id: z.number().optional(),
    })),
  }),
  victory_points: z.looseObject({
    active_total: z.array(z.looseObject({
      amount: z.number().optional(),
      character_id: z.number().optional(),
    })),
    last_week: z.array(z.looseObject({
      amount: z.number().optional(),
      character_id: z.number().optional(),
    })),
    yesterday: z.array(z.looseObject({
      amount: z.number().optional(),
      character_id: z.number().optional(),
    })),
  }),
});

export const FwLeaderboardsCorporationsGetSchema = z.looseObject({
  kills: z.looseObject({
    active_total: z.array(z.looseObject({
      amount: z.number().optional(),
      corporation_id: z.number().optional(),
    })),
    last_week: z.array(z.looseObject({
      amount: z.number().optional(),
      corporation_id: z.number().optional(),
    })),
    yesterday: z.array(z.looseObject({
      amount: z.number().optional(),
      corporation_id: z.number().optional(),
    })),
  }),
  victory_points: z.looseObject({
    active_total: z.array(z.looseObject({
      amount: z.number().optional(),
      corporation_id: z.number().optional(),
    })),
    last_week: z.array(z.looseObject({
      amount: z.number().optional(),
      corporation_id: z.number().optional(),
    })),
    yesterday: z.array(z.looseObject({
      amount: z.number().optional(),
      corporation_id: z.number().optional(),
    })),
  }),
});

export const FwLeaderboardsGetSchema = z.looseObject({
  kills: z.looseObject({
    active_total: z.array(z.looseObject({
      amount: z.number().optional(),
      faction_id: z.number().optional(),
    })),
    last_week: z.array(z.looseObject({
      amount: z.number().optional(),
      faction_id: z.number().optional(),
    })),
    yesterday: z.array(z.looseObject({
      amount: z.number().optional(),
      faction_id: z.number().optional(),
    })),
  }),
  victory_points: z.looseObject({
    active_total: z.array(z.looseObject({
      amount: z.number().optional(),
      faction_id: z.number().optional(),
    })),
    last_week: z.array(z.looseObject({
      amount: z.number().optional(),
      faction_id: z.number().optional(),
    })),
    yesterday: z.array(z.looseObject({
      amount: z.number().optional(),
      faction_id: z.number().optional(),
    })),
  }),
});

export const FwStatsGetSchema = z.looseObject({
  faction_id: z.number(),
  kills: z.looseObject({
    last_week: z.number(),
    total: z.number(),
    yesterday: z.number(),
  }),
  pilots: z.number(),
  systems_controlled: z.number(),
  victory_points: z.looseObject({
    last_week: z.number(),
    total: z.number(),
    yesterday: z.number(),
  }),
});

export const FwSystemsGetSchema = z.looseObject({
  contested: z.enum(['captured', 'contested', 'uncontested', 'vulnerable']),
  occupier_faction_id: z.number(),
  owner_faction_id: z.number(),
  solar_system_id: z.number(),
  victory_points: z.number(),
  victory_points_threshold: z.number(),
});

export const FwWarsGetSchema = z.looseObject({
  against_id: z.number(),
  faction_id: z.number(),
});
