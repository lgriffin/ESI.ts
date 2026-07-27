 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { dogmaEndpoints } from '../../core/endpoints/dogmaEndpoints';
import { DogmaAttributeSchema, DogmaDynamicItemSchema, DogmaEffectSchema } from '../../schemas/dogma';

export class GeneratedDogmaClient extends BaseEsiClient<typeof dogmaEndpoints> {
  constructor(client: ApiClient) {
    super(client, dogmaEndpoints);
  }

  /**
   * GET getAttributes
   */
  getAttributes(): Promise<number[]> {
    return this.api.getAttributes() as Promise<number[]>;
  }

  /**
   * GET getAttributeById
   */
  getAttributeById(attributeId: number | string): Promise<z.infer<typeof DogmaAttributeSchema>> {
    return this.api.getAttributeById(attributeId) as Promise<z.infer<typeof DogmaAttributeSchema>>;
  }

  /**
   * GET getEffects
   */
  getEffects(): Promise<number[]> {
    return this.api.getEffects() as Promise<number[]>;
  }

  /**
   * GET getEffectById
   */
  getEffectById(effectId: number | string): Promise<z.infer<typeof DogmaEffectSchema>> {
    return this.api.getEffectById(effectId) as Promise<z.infer<typeof DogmaEffectSchema>>;
  }

  /**
   * GET getDynamicItemInfo
   */
  getDynamicItemInfo(typeId: number | string, itemId: number | string): Promise<z.infer<typeof DogmaDynamicItemSchema>> {
    return this.api.getDynamicItemInfo(typeId, itemId) as Promise<z.infer<typeof DogmaDynamicItemSchema>>;
  }
}
