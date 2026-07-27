 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: 68191d093493

import { z } from 'zod';

export const CharactersCharacterIdKillmailsRecentGetSchema = z.looseObject({
  killmail_hash: z.string(),
  killmail_id: z.number(),
});

export const CorporationsCorporationIdKillmailsRecentGetSchema = z.looseObject({
  killmail_hash: z.string(),
  killmail_id: z.number(),
});

export const KillmailsKillmailIdKillmailHashGetSchema = z.looseObject({
  attackers: z.array(z.looseObject({
    alliance_id: z.number().optional(),
    character_id: z.number().optional(),
    corporation_id: z.number().optional(),
    damage_done: z.number(),
    faction_id: z.number().optional(),
    final_blow: z.boolean(),
    security_status: z.number(),
    ship_type_id: z.number().optional(),
    weapon_type_id: z.number().optional(),
  })),
  killmail_id: z.number(),
  killmail_time: z.string(),
  moon_id: z.number().optional(),
  solar_system_id: z.number(),
  victim: z.looseObject({
    alliance_id: z.number().optional(),
    character_id: z.number().optional(),
    corporation_id: z.number().optional(),
    damage_taken: z.number(),
    faction_id: z.number().optional(),
    items: z.array(z.looseObject({
      flag: z.number(),
      item_type_id: z.number(),
      items: z.array(z.looseObject({
        flag: z.number(),
        item_type_id: z.number(),
        quantity_destroyed: z.number().optional(),
        quantity_dropped: z.number().optional(),
        singleton: z.number(),
      })).optional(),
      quantity_destroyed: z.number().optional(),
      quantity_dropped: z.number().optional(),
      singleton: z.number(),
    })).optional(),
    position: z.looseObject({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }).optional(),
    ship_type_id: z.number(),
  }),
  war_id: z.number().optional(),
});
