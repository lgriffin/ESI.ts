import { z } from 'zod';
import { esiEnum } from './esiEnum';

export const SkinrLicenseSchema = z.looseObject({
  skinr_id: z.string(),
  activated: z.boolean(),
  unactivated: z.number(),
});

export const CharacterSkinrSchema = z.looseObject({
  licenses: z.array(SkinrLicenseSchema),
});

export const SkinrComponentRunsSchema = z.looseObject({
  remaining: z.number().optional(),
  unlimited: z.boolean().optional(),
});

export const SkinrComponentLicenseSchema = z.looseObject({
  component_id: z.number(),
  type: esiEnum(['nanocoating', 'pattern']),
  runs: SkinrComponentRunsSchema,
});

export const CharacterSkinrComponentsSchema = z.looseObject({
  licenses: z.array(SkinrComponentLicenseSchema),
});

export const SkinrTierSchema = z.looseObject({
  level: z.number(),
});

export const SkinrLayoutSlotSchema = z.looseObject({});

export const SkinrLayoutSchema = z.looseObject({
  slots: z.array(SkinrLayoutSlotSchema),
  pattern_blend_mode: esiEnum([
    'normal',
    'subtract',
    'exclusion',
    'nested',
    'nested_inverted',
  ]),
});

export const SkinrSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  creator_id: z.number(),
  ship_type_id: z.number(),
  line: z.string().optional(),
  tier: SkinrTierSchema,
  layout: SkinrLayoutSchema,
});
