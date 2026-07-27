 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { marketEndpoints } from '../../core/endpoints/marketEndpoints';
import { MarketGroupSchema, MarketHistorySchema, MarketOrderSchema, MarketPriceSchema } from '../../schemas/market';

export class GeneratedMarketClient extends BaseEsiClient<typeof marketEndpoints> {
  constructor(client: ApiClient) {
    super(client, marketEndpoints);
  }

  /**
   * GET getCharacterOrders
   * @requires Authentication
   */
  getCharacterOrders(characterId: number | string): Promise<(z.infer<typeof MarketOrderSchema>)[]> {
    return this.api.getCharacterOrders(characterId) as Promise<(z.infer<typeof MarketOrderSchema>)[]>;
  }

  /**
   * GET getCharacterOrderHistory
   * @requires Authentication
   */
  getCharacterOrderHistory(characterId: number | string): Promise<(z.infer<typeof MarketOrderSchema>)[]> {
    return this.api.getCharacterOrderHistory(characterId) as Promise<(z.infer<typeof MarketOrderSchema>)[]>;
  }

  /**
   * GET getCorporationOrders
   * @requires Authentication
   */
  getCorporationOrders(corporationId: number | string): Promise<(z.infer<typeof MarketOrderSchema>)[]> {
    return this.api.getCorporationOrders(corporationId) as Promise<(z.infer<typeof MarketOrderSchema>)[]>;
  }

  /**
   * GET getCorporationOrderHistory
   * @requires Authentication
   */
  getCorporationOrderHistory(corporationId: number | string): Promise<(z.infer<typeof MarketOrderSchema>)[]> {
    return this.api.getCorporationOrderHistory(corporationId) as Promise<(z.infer<typeof MarketOrderSchema>)[]>;
  }

  /**
   * GET getMarketGroups
   */
  getMarketGroups(): Promise<number[]> {
    return this.api.getMarketGroups() as Promise<number[]>;
  }

  /**
   * GET getMarketGroupInformation
   */
  getMarketGroupInformation(marketGroupId: number | string): Promise<z.infer<typeof MarketGroupSchema>> {
    return this.api.getMarketGroupInformation(marketGroupId) as Promise<z.infer<typeof MarketGroupSchema>>;
  }

  /**
   * GET getMarketPrices
   */
  getMarketPrices(): Promise<(z.infer<typeof MarketPriceSchema>)[]> {
    return this.api.getMarketPrices() as Promise<(z.infer<typeof MarketPriceSchema>)[]>;
  }

  /**
   * GET getMarketOrdersInStructure
   */
  getMarketOrdersInStructure(structureId: number | string): Promise<(z.infer<typeof MarketOrderSchema>)[]> {
    return this.api.getMarketOrdersInStructure(structureId) as Promise<(z.infer<typeof MarketOrderSchema>)[]>;
  }

  /**
   * GET getMarketHistory
   */
  getMarketHistory(regionId: number | string, typeId?: string | number | boolean): Promise<(z.infer<typeof MarketHistorySchema>)[]> {
    return this.api.getMarketHistory(regionId, typeId) as Promise<(z.infer<typeof MarketHistorySchema>)[]>;
  }

  /**
   * GET getMarketOrders
   */
  getMarketOrders(regionId: number | string, orderType?: string | number | boolean): Promise<(z.infer<typeof MarketOrderSchema>)[]> {
    return this.api.getMarketOrders(regionId, orderType) as Promise<(z.infer<typeof MarketOrderSchema>)[]>;
  }

  /**
   * GET getMarketTypes
   */
  getMarketTypes(regionId: number | string): Promise<number[]> {
    return this.api.getMarketTypes(regionId) as Promise<number[]>;
  }
}
