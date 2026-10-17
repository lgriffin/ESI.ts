import { z } from 'zod';
import {
  CharacterSkinrSchema,
  CharacterSkinrComponentsSchema,
  SkinrSchema,
  SkinrLicenseSchema,
  SkinrComponentLicenseSchema,
} from '../schemas/cosmetics';

export type CharacterSkinr = z.infer<typeof CharacterSkinrSchema>;
export type CharacterSkinrComponents = z.infer<
  typeof CharacterSkinrComponentsSchema
>;
export type Skinr = z.infer<typeof SkinrSchema>;
export type SkinrLicense = z.infer<typeof SkinrLicenseSchema>;
export type SkinrComponentLicense = z.infer<typeof SkinrComponentLicenseSchema>;
