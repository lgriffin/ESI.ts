import { z } from 'zod';
import {
  CharacterAssetSchema,
  AssetLocationSchema,
  AssetNameSchema,
} from '../schemas/assets';

export type CharacterAsset = z.infer<typeof CharacterAssetSchema>;
export type AssetLocation = z.infer<typeof AssetLocationSchema>;
export type AssetName = z.infer<typeof AssetNameSchema>;
