/**
 * SDE domain: items: types, groups, categories, meta groups and the per-type extensions.
 *
 * Types for the tables of this domain; the Zod schemas that validate them
 * are in ./schemas.ts (split out of the former src/sde/types.ts, Track S
 * Run 12).
 */

/** eve_archetypes [34 rows] */
export interface Archetype {
  archetypeId: number;
  description: string;
  title: string;
}

/** eve_categories [48 rows] */
export interface EveCategory {
  categoryId: number;
  name: string;
  published: boolean;
  iconId: number | null;
}

/** eve_compressible_types [212 rows] */
export interface CompressibleType {
  typeId: number;
  compressedTypeId: number;
}

/** eve_contraband_types [8 rows] */
export interface ContrabandType {
  typeId: number;
  factions: unknown;
}

/** eve_dynamic_item_attributes [413 rows] */
export interface DynamicItemAttribute {
  dynamicItemAttributeId: number;
  attributeIDs: unknown;
  inputOutputMapping: unknown;
}

/** eve_fighter_abilities [36 rows] */
export interface FighterAbility {
  fighterAbilityId: number;
  disallowInHighSec: boolean;
  disallowInLowSec: boolean;
  displayName: string;
  iconId: number;
  targetMode: string;
  tooltipText: string | null;
  turretGraphicId: number | null;
}

/** eve_fighter_abilities_by_type [94 rows] */
export interface FighterAbilityByType {
  typeId: number;
  abilitySlot0: unknown;
  abilitySlot1: unknown;
  abilitySlot2: unknown;
}

/** eve_groups [1610 rows] */
export interface EveGroup {
  groupId: number;
  anchorable: boolean;
  anchored: boolean;
  categoryId: number;
  fittableNonSingleton: boolean;
  name: string;
  published: boolean;
  useBasePrice: boolean;
  iconId: number | null;
}

/** eve_link_with_ship [3 rows] */
export interface LinkWithShip {
  linkWithShipId: number;
  applyPvpFlag: boolean;
  canRelink: boolean;
  characterEnergyCost: number;
  dbuffPostLinkDuration: number;
  dbuffs: unknown;
  generateCynoInhibitor: boolean;
  keepDbuffDurationOnLinkBreak: boolean;
  linkDuration: number;
  linkEffectGraphicIdOverride: number;
  linkableShipTypeListId: number;
  maxLinkRange: number;
  omegaOnly: boolean;
  solarsystemInterferenceCost: number;
}

/** eve_masteries [476 rows] */
export interface Mastery {
  typeId: number;
  '0': unknown;
  '1': unknown;
  '2': unknown;
  '3': unknown;
  '4': unknown;
}

/** eve_meta_groups [13 rows] */
export interface MetaGroup {
  metaGroupId: number;
  color: unknown;
  name: string;
  iconId: number | null;
  iconSuffix: string | null;
  description: string | null;
}

/** eve_ship_tree_elements [30 rows] */
export interface ShipTreeElement {
  shipTreeElementId: number;
  description: string;
  icon: string;
  name: string;
}

/** eve_ship_tree_factions [17 rows] */
export interface ShipTreeFaction {
  factionId: number;
  description: string;
  elements: unknown;
  icon: string;
}

/** eve_ship_tree_groups [52 rows] */
export interface ShipTreeGroup {
  shipTreeGroupId: number;
  description: string;
  elements: unknown;
  icon: string;
  iconLarge: string;
  iconSmall: string;
  iconSmallNPC: string;
  name: string;
  preReqSkills: unknown;
}

/** eve_type_bonuses [652 rows] */
export interface TypeBonus {
  typeId: number;
  roleBonuses: unknown;
  types: unknown;
  iconId?: number;
  /** Bonuses that belong to no skill or role, with their text. */
  miscBonuses?: Array<{
    bonusText: string;
    importance?: number;
    isPositive?: boolean;
  }>;
}

/** eve_type_dogma [26828 rows] */
export interface TypeDogma {
  typeId: number;
  dogmaAttributes: unknown;
  dogmaEffects: unknown;
}

/** eve_type_elements [423 rows] */
export interface TypeElement {
  typeId: number;
  elements: unknown;
}

/** eve_type_lists [462 rows] */
export interface TypeList {
  typeListId: number;
  includedTypeIDs: unknown;
  name: string;
  includedGroupIDs: unknown;
  includedCategoryIDs: unknown;
  excludedGroupIDs: unknown;
  excludedTypeIDs: unknown;
  excludedCategoryIDs: unknown;
  displayDescription?: string;
  displayName?: string;
}

/** eve_type_materials [9551 rows] */
export interface TypeMaterial {
  typeId: number;
  materials: unknown;
  /** Materials whose quantity is drawn between a minimum and a maximum. */
  randomizedMaterials?: Array<{
    materialTypeId: number;
    quantityMin: number;
    quantityMax: number;
  }>;
}

/** eve_types [52863 rows] */
export interface EveType {
  typeId: number;
  groupId: number;
  mass: number;
  name: string;
  portionSize: number;
  published: boolean;
  packagedVolume: number | null;
  volume: number | null;
  radius: number | null;
  description: string | null;
  graphicId: number | null;
  soundId: number | null;
  iconId: number | null;
  raceId: number | null;
  basePrice: number | null;
  marketGroupId: number | null;
  capacity: number | null;
  isRepackable: boolean | null;
  factionId?: number;
  /** True for a type whose attributes are rolled per item (mutaplasmid results). */
  isDynamicType?: boolean;
  metaGroupId?: number;
  metaLevel?: number;
  shipTreeGroupId?: number;
  techLevel?: number;
  /** The type this one is a variation of. */
  variationParentTypeId?: number;
}
