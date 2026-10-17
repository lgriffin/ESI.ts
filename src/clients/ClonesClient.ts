import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { cloneEndpoints } from '../core/endpoints/cloneEndpoints';
import { CloneInfo } from '../types/api-responses';
import { PageResult } from '../core/pagination/AsyncPaginationIterator';

/**
 * A legacy domain client over the hand-written endpoint map.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. Use `createEsi()` from
 * `@lgriffin/esi.ts/client`: `esi.public` for public routes and
 * `esi.as(identity)` for authenticated ones. guides/LEGACY-REMOVAL.md
 * lists every legacy surface, its replacement and the open parity gaps.
 */
export class ClonesClient extends BaseEsiClient<typeof cloneEndpoints> {
  constructor(client: ApiClient) {
    super(client, cloneEndpoints);
  }

  /**
   * Retrieve a character's clone state, including home station and available jump clones.
   *
   * @param characterId - The ID of the character whose clone information to retrieve
   * @returns Clone information including home location and jump clone details
   * @requires Authentication
   */
  getClones(characterId: number): Promise<CloneInfo> {
    return this.api.getClones(characterId);
  }

  /**
   * Retrieve the implants currently installed in a character's active clone.
   *
   * @param characterId - The ID of the character whose implants to retrieve
   * @returns An array of type IDs for the currently installed implants
   * @requires Authentication
   */
  getImplants(characterId: number): Promise<number[]> {
    return this.api.getImplants(characterId);
  }

  fetchAllImplants(
    characterId: number,
    concurrency?: number,
  ): Promise<number[]> {
    return this.fetchAllEndpoint<number>(
      'getImplants',
      [characterId],
      concurrency,
    );
  }

  streamImplants(
    characterId: number,
  ): AsyncGenerator<PageResult<number>, void, undefined> {
    return this.streamEndpoint<number>('getImplants', characterId);
  }
}
