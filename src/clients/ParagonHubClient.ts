import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { paragonHubEndpoints } from '../core/endpoints/paragonHubEndpoints';
import {
  ParagonHubSkinrResponse,
  ParagonHubCharacterSkinrResponse,
} from '../types/api-responses';

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
