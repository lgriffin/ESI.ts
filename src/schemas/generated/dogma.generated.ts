 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: 68191d093493

import { z } from 'zod';

export const DogmaAttributesAttributeIdGetSchema = z.looseObject({
  attribute_id: z.number(),
  default_value: z.number().optional(),
  description: z.string().optional(),
  display_name: z.string().optional(),
  high_is_good: z.boolean().optional(),
  icon_id: z.number().optional(),
  name: z.string().optional(),
  published: z.boolean().optional(),
  stackable: z.boolean().optional(),
  unit_id: z.number().optional(),
});

export const DogmaDynamicItemsTypeIdItemIdGetSchema = z.looseObject({
  created_by: z.number(),
  dogma_attributes: z.array(z.looseObject({
    attribute_id: z.number(),
    value: z.number(),
  })),
  dogma_effects: z.array(z.looseObject({
    effect_id: z.number(),
    is_default: z.boolean(),
  })),
  mutator_type_id: z.number(),
  source_type_id: z.number(),
});

export const DogmaEffectsEffectIdGetSchema = z.looseObject({
  description: z.string().optional(),
  disallow_auto_repeat: z.boolean().optional(),
  discharge_attribute_id: z.number().optional(),
  display_name: z.string().optional(),
  duration_attribute_id: z.number().optional(),
  effect_category: z.number().optional(),
  effect_id: z.number(),
  electronic_chance: z.boolean().optional(),
  falloff_attribute_id: z.number().optional(),
  icon_id: z.number().optional(),
  is_assistance: z.boolean().optional(),
  is_offensive: z.boolean().optional(),
  is_warp_safe: z.boolean().optional(),
  modifiers: z.array(z.looseObject({
    domain: z.string().optional(),
    effect_id: z.number().optional(),
    func: z.string(),
    modified_attribute_id: z.number().optional(),
    modifying_attribute_id: z.number().optional(),
    operator: z.number().optional(),
  })).optional(),
  name: z.string().optional(),
  post_expression: z.number().optional(),
  pre_expression: z.number().optional(),
  published: z.boolean().optional(),
  range_attribute_id: z.number().optional(),
  range_chance: z.boolean().optional(),
  tracking_speed_attribute_id: z.number().optional(),
});
