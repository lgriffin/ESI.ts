import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { loyaltyEndpoints } from '../core/endpoints/loyaltyEndpoints';
import { LoyaltyPoints, LoyaltyStoreOffer } from '../types/api-responses';
import { PageResult } from '../core/pagination/AsyncPaginationIterator';

/**
 * A legacy domain client over the hand-written endpoint map.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. Use `createEsi()` from
 * `@lgriffin/esi.ts/client`: `esi.public` for public routes and
 * `esi.as(identity)` for authenticated ones. guides/LEGACY-REMOVAL.md
 * lists every legacy surface, its replacement and the open parity gaps.
 */
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
    return this.api.getLoyaltyPoints(characterId);
  }

  /**
   * Retrieves the list of items available in an NPC corporation's loyalty point store.
   *
   * @param corporationId - The ID of the NPC corporation whose LP store to query
   * @returns A list of offers available in the loyalty store
   */
  getLoyaltyStoreOffers(corporationId: number): Promise<LoyaltyStoreOffer[]> {
    return this.api.getLoyaltyStoreOffers(corporationId);
  }

  fetchAllLoyaltyPoints(
    characterId: number,
    concurrency?: number,
  ): Promise<LoyaltyPoints[]> {
    return this.fetchAllEndpoint<LoyaltyPoints>(
      'getLoyaltyPoints',
      [characterId],
      concurrency,
    );
  }

  fetchAllLoyaltyStoreOffers(
    corporationId: number,
    concurrency?: number,
  ): Promise<LoyaltyStoreOffer[]> {
    return this.fetchAllEndpoint<LoyaltyStoreOffer>(
      'getLoyaltyStoreOffers',
      [corporationId],
      concurrency,
    );
  }

  streamLoyaltyPoints(
    characterId: number,
  ): AsyncGenerator<PageResult<LoyaltyPoints>, void, undefined> {
    return this.streamEndpoint<LoyaltyPoints>('getLoyaltyPoints', characterId);
  }

  streamLoyaltyStoreOffers(
    corporationId: number,
  ): AsyncGenerator<PageResult<LoyaltyStoreOffer>, void, undefined> {
    return this.streamEndpoint<LoyaltyStoreOffer>(
      'getLoyaltyStoreOffers',
      corporationId,
    );
  }
}
