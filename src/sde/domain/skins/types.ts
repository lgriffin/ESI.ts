/**
 * SDE domain: skins, skin licences and materials, and the SKINR tables.
 *
 * Types for the tables of this domain; the Zod schemas that validate them
 * are in ./schemas.ts (split out of the former src/sde/types.ts, Track S
 * Run 12).
 */

/** eve_skin_licenses [11824 rows] */
export interface SkinLicense {
  duration: number;
  licenseTypeId: number;
  skinId: number;
  isSingleUse?: boolean;
}

/** eve_skin_materials [863 rows] — no PK */
export interface SkinMaterial {
  displayName: string;
  materialSetId: number;
}

/** eve_skinr_component_categories [3 rows] */
export interface SkinrComponentCategory {
  skinrComponentCategoryId: number;
  name: string;
}

/** eve_skinr_component_point_values [3 rows] — numeric column names, no PK */
export interface SkinrComponentPointValue {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
  '6': number;
}

/** eve_skinr_component_rarities [6 rows] */
export interface SkinrComponentRarity {
  skinrComponentRarityId: number;
  name: string;
  rank: number;
}

/** eve_skinr_components [544 rows] */
export interface SkinrComponent {
  skinrComponentId: number;
  associatedTypeIds: unknown;
  category: number;
  finish: string;
  iconFile: string;
  name: string;
  projectionTypeU: string;
  projectionTypeV: string;
  published: boolean;
  rarity: number;
  resourceFile: string;
  sequenceBinder: unknown;
}

/** eve_skinr_slot_categories [3 rows] */
export interface SkinrSlotCategory {
  skinrSlotCategoryId: number;
  name: string;
}

/** eve_skinr_slot_configurations [4 rows] */
export interface SkinrSlotConfiguration {
  skinrSlotConfigurationId: number;
  allowAllShips: boolean;
  config: unknown;
  name: string;
  priority: number;
  ships: unknown;
}

/** eve_skinr_slot_names [8 rows] */
export interface SkinrSlotName {
  skinrSlotNameId: number;
  name: string;
}

/** eve_skinr_slots [8 rows] */
export interface SkinrSlot {
  skinrSlotId: number;
  allowedDesignComponentCategories: unknown;
  category: number;
  name: string;
}

/** eve_skinr_slots_to_materials [16 rows] */
export interface SkinrSlotToMaterial {
  skinrSlotToMaterialId: number;
  '0': unknown;
  '1': unknown;
  '2': unknown;
  '3': unknown;
}

/** eve_skinr_tier_thresholds [49 rows] — numeric column names, no PK */
export interface SkinrTierThreshold {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
  '6': number;
  '7': number;
  '8': number;
  '9': number;
  '10': number;
  '11': number;
  '12': number;
  '13': number;
  '14': number;
  '15': number;
  '16': number;
  '17': number;
  '18': number;
  '19': number;
}

/** eve_skins [6995 rows] */
export interface Skin {
  skinId: number;
  allowCCPDevs: boolean;
  internalName: string;
  skinMaterialId: number;
  types: unknown;
  visibleSerenity: boolean;
  visibleTranquility: boolean;
  isStructureSkin: string | null;
}
