import { z } from 'zod';

export const DogmaAttributeSchema = z.looseObject({
  attribute_id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  icon_id: z.number().optional(),
  default_value: z.number().optional(),
  published: z.boolean().optional(),
  display_name: z.string().optional(),
  unit_id: z.number().optional(),
  stackable: z.boolean().optional(),
  high_is_good: z.boolean().optional(),
});

export const DogmaEffectSchema = z.looseObject({
  effect_id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  icon_id: z.number().optional(),
  display_name: z.string().optional(),
  published: z.boolean().optional(),
  effect_category: z.number().optional(),
  is_assistance: z.boolean().optional(),
  is_offensive: z.boolean().optional(),
  is_warp_safe: z.boolean().optional(),
  disallow_auto_repeat: z.boolean().optional(),
});

export const DogmaDynamicItemSchema = z.looseObject({
  created_by: z.number(),
  dogma_attributes: z.array(
    z.looseObject({
      attribute_id: z.number(),
      value: z.number(),
    }),
  ),
  dogma_effects: z.array(
    z.looseObject({
      effect_id: z.number(),
      is_default: z.boolean(),
    }),
  ),
  mutator_type_id: z.number(),
  source_type_id: z.number(),
});
