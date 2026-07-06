import { z } from 'zod';

export const CharacterAssetSchema = z.looseObject({
  item_id: z.number(),
  type_id: z.number(),
  quantity: z.number(),
  location_id: z.number(),
  location_type: z.enum(['station', 'solar_system', 'item', 'other']),
  location_flag: z.string(),
  is_singleton: z.boolean(),
  is_blueprint_copy: z.boolean().optional(),
});

export const AssetLocationSchema = z.looseObject({
  item_id: z.number(),
  position: z.looseObject({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
});

export const AssetNameSchema = z.looseObject({
  item_id: z.number(),
  name: z.string(),
});
