import { z } from 'zod';

export const CharacterLocationSchema = z.looseObject({
  solar_system_id: z.number(),
  station_id: z.number().optional(),
  structure_id: z.number().optional(),
});

export const CharacterOnlineSchema = z.looseObject({
  online: z.boolean(),
  last_login: z.string().optional(),
  last_logout: z.string().optional(),
  logins: z.number().optional(),
});

export const CharacterShipSchema = z.looseObject({
  ship_item_id: z.number(),
  ship_name: z.string(),
  ship_type_id: z.number(),
});
