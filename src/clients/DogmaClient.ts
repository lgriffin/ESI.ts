import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { dogmaEndpoints } from '../core/endpoints/dogmaEndpoints';
import {
  DogmaAttribute,
  DogmaEffect,
  DogmaDynamicItem,
} from '../types/api-responses';

export class DogmaClient extends BaseEsiClient<typeof dogmaEndpoints> {
  constructor(client: ApiClient) {
    super(client, dogmaEndpoints);
  }

  /**
   * Retrieves a list of all dogma attribute IDs.
   *
   * @returns An array of dogma attribute IDs
   */
  getAttributes(): Promise<number[]> {
    return this.api.getAttributes() as Promise<number[]>;
  }

  /**
   * Retrieves detailed information about a specific dogma attribute.
   *
   * @param attributeId - The ID of the dogma attribute to look up
   * @returns Detailed information about the dogma attribute
   */
  getAttributeById(attributeId: number): Promise<DogmaAttribute> {
    return this.api.getAttributeById(attributeId) as Promise<DogmaAttribute>;
  }

  /**
   * Retrieves the dynamic dogma information for a specific mutated item, including its modified attributes.
   *
   * @param typeId - The type ID of the item
   * @param itemId - The item ID of the specific dynamic item
   * @returns Dynamic dogma information for the mutated item
   */
  getDynamicItemInfo(
    typeId: number,
    itemId: number,
  ): Promise<DogmaDynamicItem> {
    return this.api.getDynamicItemInfo(
      typeId,
      itemId,
    ) as Promise<DogmaDynamicItem>;
  }

  /**
   * Retrieves a list of all dogma effect IDs.
   *
   * @returns An array of dogma effect IDs
   */
  getEffects(): Promise<number[]> {
    return this.api.getEffects() as Promise<number[]>;
  }

  /**
   * Retrieves detailed information about a specific dogma effect.
   *
   * @param effectId - The ID of the dogma effect to look up
   * @returns Detailed information about the dogma effect
   */
  getEffectById(effectId: number): Promise<DogmaEffect> {
    return this.api.getEffectById(effectId) as Promise<DogmaEffect>;
  }
}
