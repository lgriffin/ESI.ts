import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { paragonHubEndpoints } from '../core/endpoints/paragonHubEndpoints';
import {
  ParagonHubSkinrResponse,
  ParagonHubCharacterSkinrResponse,
} from '../types/api-responses';

/**
 * A legacy domain client over the hand-written endpoint map.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. Use `createEsi()` from
 * `@lgriffin/esi.ts/client`: `esi.public` for public routes and
 * `esi.as(identity)` for authenticated ones. guides/LEGACY-REMOVAL.md
 * lists every legacy surface, its replacement and the open parity gaps.
 */
export class ParagonHubClient extends BaseEsiClient<
  typeof paragonHubEndpoints
> {
  constructor(client: ApiClient) {
    super(client, paragonHubEndpoints);
  }

  getPublicListings(
    after?: string,
    before?: string,
    limit?: number,
  ): Promise<ParagonHubSkinrResponse> {
    return this.api.getPublicListings(after, before, limit);
  }

  getCharacterListings(
    characterId: number,
    after?: string,
    before?: string,
    limit?: number,
  ): Promise<ParagonHubCharacterSkinrResponse> {
    return this.api.getCharacterListings(characterId, after, before, limit);
  }

  getAllianceListings(
    allianceId: number,
    after?: string,
    before?: string,
    limit?: number,
  ): Promise<ParagonHubSkinrResponse> {
    return this.api.getAllianceListings(allianceId, after, before, limit);
  }

  getCharacterTargetedListings(
    characterId: number,
    after?: string,
    before?: string,
    limit?: number,
  ): Promise<ParagonHubSkinrResponse> {
    return this.api.getCharacterTargetedListings(
      characterId,
      after,
      before,
      limit,
    );
  }

  getCorporationListings(
    corporationId: number,
    after?: string,
    before?: string,
    limit?: number,
  ): Promise<ParagonHubSkinrResponse> {
    return this.api.getCorporationListings(corporationId, after, before, limit);
  }
}
