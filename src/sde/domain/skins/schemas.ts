/**
 * SDE domain: skins, skin licences and materials, and the SKINR tables.
 *
 * Zod schemas for the tables of this domain, next to the types in
 * ./types.ts they validate (split out of the former src/sde/schemas.ts,
 * Track S Run 12).
 */

import { z } from 'zod';

export const SkinLicenseSchema = z.looseObject({
  duration: z.number().int(),
  licenseTypeId: z.number().int(),
  skinId: z.number().int(),
});

export const SkinMaterialSchema = z.looseObject({
  displayName: z.string(),
  materialSetId: z.number().int(),
});

export const SkinrComponentCategorySchema = z.looseObject({
  skinrComponentCategoryId: z.number().int(),
  name: z.string(),
});

export const SkinrComponentPointValueSchema = z.looseObject({
  '1': z.number().int(),
  '2': z.number().int(),
  '3': z.number().int(),
  '4': z.number().int(),
  '5': z.number().int(),
  '6': z.number().int(),
});

export const SkinrComponentRaritySchema = z.looseObject({
  skinrComponentRarityId: z.number().int(),
  name: z.string(),
  rank: z.number().int(),
});

export const SkinrComponentSchema = z.looseObject({
  skinrComponentId: z.number().int(),
  associatedTypeIds: z.unknown(),
  category: z.number().int(),
  finish: z.string(),
  iconFile: z.string(),
  name: z.string(),
  projectionTypeU: z.string(),
  projectionTypeV: z.string(),
  published: z.boolean(),
  rarity: z.number().int(),
  resourceFile: z.string(),
  sequenceBinder: z.unknown(),
});

export const SkinrSlotCategorySchema = z.looseObject({
  skinrSlotCategoryId: z.number().int(),
  name: z.string(),
});

export const SkinrSlotConfigurationSchema = z.looseObject({
  skinrSlotConfigurationId: z.number().int(),
  allowAllShips: z.boolean(),
  config: z.unknown(),
  name: z.string(),
  priority: z.number().int(),
  ships: z.unknown().nullable(),
});

export const SkinrSlotNameSchema = z.looseObject({
  skinrSlotNameId: z.number().int(),
  name: z.string(),
});

export const SkinrSlotSchema = z.looseObject({
  skinrSlotId: z.number().int(),
  allowedDesignComponentCategories: z.unknown(),
  category: z.number().int(),
  name: z.string(),
});

export const SkinrSlotToMaterialSchema = z.looseObject({
  skinrSlotToMaterialId: z.number().int(),
  '0': z.unknown(),
  '1': z.unknown(),
  '2': z.unknown(),
  '3': z.unknown(),
});

export const SkinrTierThresholdSchema = z.looseObject({
  '1': z.number().int(),
  '2': z.number().int(),
  '3': z.number().int(),
  '4': z.number().int(),
  '5': z.number().int(),
  '6': z.number().int(),
  '7': z.number().int(),
  '8': z.number().int(),
  '9': z.number().int(),
  '10': z.number().int(),
  '11': z.number().int(),
  '12': z.number().int(),
  '13': z.number().int(),
  '14': z.number().int(),
  '15': z.number().int(),
  '16': z.number().int(),
  '17': z.number().int(),
  '18': z.number().int(),
  '19': z.number().int(),
});

export const SkinSchema = z.looseObject({
  skinId: z.number().int(),
  allowCCPDevs: z.boolean(),
  internalName: z.string(),
  skinMaterialId: z.number().int(),
  types: z.unknown(),
  visibleSerenity: z.boolean(),
  visibleTranquility: z.boolean(),
  isStructureSkin: z.string().nullable(),
});
