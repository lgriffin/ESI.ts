/**
 * What ESI's dogma endpoints send back in 0011-dogma.feature, and where.
 * Step files queue these; they do not build payloads or URLs themselves.
 */

export const POWER_OUTPUT_ATTRIBUTE_ID = 20;
export const LOW_POWER_EFFECT_ID = 11;
export const UNKNOWN_DOGMA_ID = 999999999;

/** An abyssal module: its type and the one mutated item instance. */
export const MUTATED_ITEM = { typeId: 47740, itemId: 1234567890 };
export const UNKNOWN_DYNAMIC_ITEM = { typeId: 999999, itemId: 999999 };

export const dogmaPaths = {
  attribute: (attributeId: number) => `/dogma/attributes/${attributeId}`,
  effect: (effectId: number) => `/dogma/effects/${effectId}`,
  dynamicItem: (item: { typeId: number; itemId: number }) =>
    `/dogma/dynamic/items/${item.typeId}/${item.itemId}`,
};

/** URL matchers for the index endpoints, which are not their children. */
export const dogmaMatches = {
  attributeIndex: /\/dogma\/attributes\/?$/,
  effectIndex: /\/dogma\/effects\/?$/,
};

export const dogmaFixtures = {
  attributeIds: () => [2, 3, 4, 9, 20],

  effectIds: () => [11, 12, 13, 16, 18],

  powerOutput: () => ({
    attribute_id: POWER_OUTPUT_ATTRIBUTE_ID,
    name: 'powerOutput',
    description: 'The amount of power available.',
    icon_id: 1400,
    default_value: 0,
    published: true,
    display_name: 'Powergrid Output',
    unit_id: 106,
    stackable: true,
    high_is_good: true,
  }),

  lowPower: () => ({
    effect_id: LOW_POWER_EFFECT_ID,
    name: 'lowPower',
    description: 'Requires a low power slot.',
    published: true,
    display_name: 'Low Power',
    effect_category: 0,
    is_assistance: false,
    is_offensive: false,
    is_warp_safe: true,
    disallow_auto_repeat: false,
    electronic_chance: false,
    range_chance: false,
    pre_expression: 66,
    post_expression: 66,
  }),

  rolledAttributes: () => [
    { attribute_id: 9, value: 1.0 },
    { attribute_id: 20, value: 125.0 },
  ],

  rolledEffects: () => [
    { effect_id: 11, is_default: false },
    { effect_id: 12, is_default: true },
  ],

  mutatedItem: () => ({
    created_by: 2112625428,
    dogma_attributes: dogmaFixtures.rolledAttributes(),
    dogma_effects: dogmaFixtures.rolledEffects(),
    mutator_type_id: 47842,
    source_type_id: 2048,
  }),
};
