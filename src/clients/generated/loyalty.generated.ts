 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { loyaltyEndpoints } from '../../core/endpoints/loyaltyEndpoints';
import { LoyaltyPointsSchema, LoyaltyStoreOfferSchema } from '../../schemas/loyalty';

export class GeneratedLoyaltyClient extends BaseEsiClient<typeof loyaltyEndpoints> {
  constructor(client: ApiClient) {
    super(client, loyaltyEndpoints);
  }

  /**
   * GET getLoyaltyPoints
   * @requires Authentication
   */
  getLoyaltyPoints(characterId: number | string): Promise<(z.infer<typeof LoyaltyPointsSchema>)[]> {
    return this.api.getLoyaltyPoints(characterId) as Promise<(z.infer<typeof LoyaltyPointsSchema>)[]>;
  }

  /**
   * GET getLoyaltyStoreOffers
   */
  getLoyaltyStoreOffers(corporationId: number | string): Promise<(z.infer<typeof LoyaltyStoreOfferSchema>)[]> {
    return this.api.getLoyaltyStoreOffers(corporationId) as Promise<(z.infer<typeof LoyaltyStoreOfferSchema>)[]>;
  }
}
