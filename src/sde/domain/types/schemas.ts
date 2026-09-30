/**
 * SDE domain: items: types, groups, categories, meta groups and the per-type extensions.
 *
 * Zod schemas for the tables of this domain, next to the types in
 * ./types.ts they validate (split out of the former src/sde/schemas.ts,
 * Track S Run 12).
 */

import { z } from 'zod';

export const ArchetypeSchema = z.looseObject({
  archetypeId: z.number().int(),
  description: z.string(),
  title: z.string(),
});

export const EveCategorySchema = z.looseObject({
  categoryId: z.number().int(),
  name: z.string(),
  published: z.boolean(),
  iconId: z.number().int().nullable(),
});

export const CompressibleTypeSchema = z.looseObject({
  typeId: z.number().int(),
  compressedTypeId: z.number().int(),
});

export const ContrabandTypeSchema = z.looseObject({
  typeId: z.number().int(),
  factions: z.unknown(),
});

export const DynamicItemAttributeSchema = z.looseObject({
  dynamicItemAttributeId: z.number().int(),
  attributeIDs: z.unknown(),
  inputOutputMapping: z.unknown(),
});

export const FighterAbilitySchema = z.looseObject({
  fighterAbilityId: z.number().int(),
  disallowInHighSec: z.boolean(),
  disallowInLowSec: z.boolean(),
  displayName: z.string(),
  iconId: z.number().int(),
  targetMode: z.string(),
  tooltipText: z.string().nullable(),
  turretGraphicId: z.number().int().nullable(),
});

export const FighterAbilityByTypeSchema = z.looseObject({
  typeId: z.number().int(),
  abilitySlot0: z.unknown(),
  abilitySlot1: z.unknown(),
  abilitySlot2: z.unknown(),
});

export const EveGroupSchema = z.looseObject({
  groupId: z.number().int(),
  anchorable: z.boolean(),
  anchored: z.boolean(),
  categoryId: z.number().int(),
  fittableNonSingleton: z.boolean(),
  name: z.string(),
  published: z.boolean(),
  useBasePrice: z.boolean(),
  iconId: z.number().int().nullable(),
});

export const LinkWithShipSchema = z.looseObject({
  linkWithShipId: z.number().int(),
  applyPvpFlag: z.boolean(),
  canRelink: z.boolean(),
  characterEnergyCost: z.number().int(),
  dbuffPostLinkDuration: z.number().int(),
  dbuffs: z.unknown(),
  generateCynoInhibitor: z.boolean(),
  keepDbuffDurationOnLinkBreak: z.boolean(),
  linkDuration: z.number().int(),
  linkEffectGraphicIdOverride: z.number().int(),
  linkableShipTypeListId: z.number().int(),
  maxLinkRange: z.number().int(),
  omegaOnly: z.boolean(),
  solarsystemInterferenceCost: z.number().int(),
});

export const MasterySchema = z.looseObject({
  typeId: z.number().int(),
  '0': z.unknown(),
  '1': z.unknown(),
  '2': z.unknown(),
  '3': z.unknown(),
  '4': z.unknown(),
});

export const MetaGroupSchema = z.looseObject({
  metaGroupId: z.number().int(),
  color: z.unknown(),
  name: z.string(),
  iconId: z.number().int().nullable(),
  iconSuffix: z.string().nullable(),
  description: z.string().nullable(),
});

export const ShipTreeElementSchema = z.looseObject({
  shipTreeElementId: z.number().int(),
  description: z.string(),
  icon: z.string(),
  name: z.string(),
});

export const ShipTreeFactionSchema = z.looseObject({
  factionId: z.number().int(),
  description: z.string(),
  elements: z.unknown(),
  icon: z.string(),
});

export const ShipTreeGroupSchema = z.looseObject({
  shipTreeGroupId: z.number().int(),
  description: z.string(),
  elements: z.unknown(),
  icon: z.string(),
  iconLarge: z.string(),
  iconSmall: z.string(),
  iconSmallNPC: z.string(),
  name: z.string(),
  preReqSkills: z.unknown(),
});

export const TypeBonusSchema = z.looseObject({
  typeId: z.number().int(),
  roleBonuses: z.unknown(),
  types: z.unknown(),
  iconId: z.number().int().optional(),
  miscBonuses: z
    .array(
      z.looseObject({
        bonusText: z.string(),
        importance: z.number().int().optional(),
        isPositive: z.boolean().optional(),
      }),
    )
    .optional(),
});

export const TypeDogmaSchema = z.looseObject({
  typeId: z.number().int(),
  dogmaAttributes: z.unknown(),
  dogmaEffects: z.unknown().nullable(),
});

export const TypeElementSchema = z.looseObject({
  typeId: z.number().int(),
  elements: z.unknown(),
});

export const TypeListSchema = z.looseObject({
  typeListId: z.number().int(),
  includedTypeIDs: z.unknown(),
  name: z.string(),
  includedGroupIDs: z.unknown().nullable(),
  includedCategoryIDs: z.unknown().nullable(),
  excludedGroupIDs: z.unknown().nullable(),
  excludedTypeIDs: z.unknown().nullable(),
  excludedCategoryIDs: z.unknown().nullable(),
  displayDescription: z.string().optional(),
  displayName: z.string().optional(),
});

export const TypeMaterialSchema = z.looseObject({
  typeId: z.number().int(),
  materials: z.unknown(),
  randomizedMaterials: z
    .array(
      z.looseObject({
        materialTypeId: z.number().int(),
        quantityMin: z.number().int(),
        quantityMax: z.number().int(),
      }),
    )
    .optional(),
});

export const EveTypeSchema = z.looseObject({
  typeId: z.number().int(),
  groupId: z.number().int(),
  mass: z.number(),
  name: z.string(),
  portionSize: z.number().int(),
  published: z.boolean(),
  packagedVolume: z.number().nullable(),
  volume: z.number().nullable(),
  radius: z.number().nullable(),
  description: z.string().nullable(),
  graphicId: z.number().int().nullable(),
  soundId: z.number().int().nullable(),
  iconId: z.number().int().nullable(),
  raceId: z.number().int().nullable(),
  basePrice: z.number().nullable(),
  marketGroupId: z.number().int().nullable(),
  capacity: z.number().nullable(),
  isRepackable: z.boolean().nullable(),
  factionId: z.number().int().optional(),
  isDynamicType: z.boolean().optional(),
  metaGroupId: z.number().int().optional(),
  metaLevel: z.number().int().optional(),
  shipTreeGroupId: z.number().int().optional(),
  techLevel: z.number().int().optional(),
  variationParentTypeId: z.number().int().optional(),
});
