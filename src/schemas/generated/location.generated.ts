 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: a0ec73787c55

import { z } from 'zod';

export const CharactersCharacterIdLocationGetSchema = z.looseObject({
  solar_system_id: z.number(),
  station_id: z.number().optional(),
  structure_id: z.number().optional(),
});

export const CharactersCharacterIdOnlineGetSchema = z.looseObject({
  last_login: z.string().optional(),
  last_logout: z.string().optional(),
  logins: z.number().optional(),
  online: z.boolean(),
});

export const CharactersCharacterIdShipGetSchema = z.looseObject({
  ship_item_id: z.number(),
  ship_name: z.string(),
  ship_type_id: z.number(),
});
