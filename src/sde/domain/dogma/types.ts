/**
 * SDE domain: dogma attributes, effects, units and buff collections.
 *
 * Types for the tables of this domain; the Zod schemas that validate them
 * are in ./schemas.ts (split out of the former src/sde/types.ts, Track S
 * Run 12).
 */

/** eve_dbuff_collections [276 rows] */
export interface DbuffCollection {
  dbuffCollectionId: number;
  aggregateMode: string;
  developerDescription: unknown;
  itemModifiers: unknown;
  locationGroupModifiers: unknown;
  locationModifiers: unknown;
  locationRequiredSkillModifiers: unknown;
  operationName: string;
  showOutputValueInUI: string;
  displayName: string | null;
}

/** eve_dogma_attribute_categories [37 rows] */
export interface DogmaAttributeCategory {
  attributeCategoryId: number;
  description: string;
  name: string;
}

/** eve_dogma_attributes [2866 rows] */
export interface DogmaAttribute {
  attributeId: number;
  attributeCategoryId: number;
  dataType: number;
  defaultValue: number;
  description: string;
  displayWhenZero: boolean;
  highIsGood: boolean;
  name: string;
  published: boolean;
  stackable: boolean;
  displayName: string | null;
  iconId: number | null;
  tooltipDescription: string | null;
  tooltipTitle: string | null;
  unitId: number | null;
  chargeRechargeTimeId: number | null;
  maxAttributeId: number | null;
  minAttributeId: number | null;
}

/** eve_dogma_effects [3417 rows] */
export interface DogmaEffect {
  effectId: number;
  disallowAutoRepeat: boolean;
  dischargeAttributeId: number;
  durationAttributeId: number;
  effectCategoryId: number;
  electronicChance: boolean;
  guid: string;
  isAssistance: boolean;
  isOffensive: boolean;
  isWarpSafe: boolean;
  name: string;
  propulsionChance: boolean;
  published: boolean;
  rangeChance: boolean;
  distribution: string | null;
  falloffAttributeId: number | null;
  rangeAttributeId: number | null;
  trackingSpeedAttributeId: number | null;
  description: string | null;
  displayName: string | null;
  iconId: number | null;
  modifierInfo: unknown;
}

/** eve_dogma_units [60 rows] */
export interface DogmaUnit {
  unitId: number;
  description: string;
  displayName: string;
  name: string;
}
