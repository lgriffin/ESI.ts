import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { loyaltyEndpoints } from '../core/endpoints/loyaltyEndpoints';
import { LoyaltyPoints, LoyaltyStoreOffer } from '../types/api-responses';

export class LoyaltyClient extends BaseEsiClient<typeof loyaltyEndpoints> {
  constructor(client: ApiClient) {
    super(client, loyaltyEndpoints);
  }

  /**
   * Retrieves the loyalty points a character has earned with each NPC corporation.
   *
   * @param characterId - The ID of the character to fetch loyalty points for
   * @returns A list of loyalty point balances per corporation
   * @requires Authentication
   */
  getLoyaltyPoints(characterId: number): Promise<LoyaltyPoints[]> {
    return this.api.getLoyaltyPoints(characterId) as Promise<LoyaltyPoints[]>;
  }

  /**
   * Retrieves the list of items available in an NPC corporation's loyalty point store.
   *
   * @param corporationId - The ID of the NPC corporation whose LP store to query
   * @returns A list of offers available in the loyalty store
   */
  getLoyaltyStoreOffers(corporationId: number): Promise<LoyaltyStoreOffer[]> {
    return this.api.getLoyaltyStoreOffers(corporationId) as Promise<
      LoyaltyStoreOffer[]
    >;
  }
}
