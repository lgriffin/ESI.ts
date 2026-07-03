import { z } from 'zod';

export const KillmailSummarySchema = z.looseObject({
  killmail_id: z.number(),
  killmail_hash: z.string(),
});

export const KillmailSchema = z.looseObject({
  killmail_id: z.number(),
  killmail_time: z.string(),
  solar_system_id: z.number(),
  moon_id: z.number().optional(),
  war_id: z.number().optional(),
  victim: z.looseObject({
    character_id: z.number().optional(),
    corporation_id: z.number().optional(),
    alliance_id: z.number().optional(),
    faction_id: z.number().optional(),
    ship_type_id: z.number(),
    damage_taken: z.number(),
    position: z
      .looseObject({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      })
      .optional(),
    items: z.array(z.unknown()).optional(),
  }),
  attackers: z.array(
    z.looseObject({
      character_id: z.number().optional(),
      corporation_id: z.number().optional(),
      alliance_id: z.number().optional(),
      faction_id: z.number().optional(),
      ship_type_id: z.number().optional(),
      weapon_type_id: z.number().optional(),
      damage_done: z.number(),
      final_blow: z.boolean(),
      security_status: z.number(),
    }),
  ),
});
