export interface DogmaAttribute {
  attribute_id: number;
  name: string;
  description?: string;
  icon_id?: number;
  default_value?: number;
  published?: boolean;
  display_name?: string;
  unit_id?: number;
  stackable?: boolean;
  high_is_good?: boolean;
}

export interface DogmaEffect {
  effect_id: number;
  name: string;
  description?: string;
  icon_id?: number;
  display_name?: string;
  published?: boolean;
  effect_category?: number;
  is_assistance?: boolean;
  is_offensive?: boolean;
  is_warp_safe?: boolean;
  disallow_auto_repeat?: boolean;
}

export interface DogmaDynamicItem {
  created_by: number;
  dogma_attributes: { attribute_id: number; value: number }[];
  dogma_effects: { effect_id: number; is_default: boolean }[];
  mutator_type_id: number;
  source_type_id: number;
}
