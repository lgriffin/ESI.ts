import { z } from 'zod';
import {
  DogmaAttributeSchema,
  DogmaEffectSchema,
  DogmaDynamicItemSchema,
} from '../schemas/dogma';

export type DogmaAttribute = z.infer<typeof DogmaAttributeSchema>;
export type DogmaEffect = z.infer<typeof DogmaEffectSchema>;
export type DogmaDynamicItem = z.infer<typeof DogmaDynamicItemSchema>;
