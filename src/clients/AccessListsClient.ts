import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { accessListEndpoints } from '../core/endpoints/accessListEndpoints';
import {
  AccessList,
  CharacterAccessListsResponse,
} from '../types/api-responses';

/**
 * A legacy domain client over the hand-written endpoint map.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. Use `createEsi()` from
 * `@lgriffin/esi.ts/client`: `esi.public` for public routes and
 * `esi.as(identity)` for authenticated ones. guides/LEGACY-REMOVAL.md
 * lists every legacy surface, its replacement and the open parity gaps.
 */
export class AccessListsClient extends BaseEsiClient<
  typeof accessListEndpoints
> {
  constructor(client: ApiClient) {
    super(client, accessListEndpoints);
  }

  /**
   * Retrieves an access list (ACL): its name, description and the characters, corporations and
   * alliances it lists, each with an access level.
   *
   * @param characterId - The ID of the character who owns the access list
   * @param accessListId - The ID of the access list to retrieve
   * @returns The access list: `id`, `name`, `description` and `membership`
   * @requires Authentication
   */
  getAccessList(
    characterId: number,
    accessListId: number,
  ): Promise<AccessList> {
    return this.api.getAccessList(characterId, accessListId);
  }

  /**
   * Retrieves the IDs of a character's access lists. Call `getAccessList` for a list's contents.
   *
   * @param characterId - The ID of the character
   * @returns ESI's response as sent: `access_lists`, one entry per list with its `id`
   * @requires Authentication
   */
  getCharacterAccessLists(
    characterId: number,
  ): Promise<CharacterAccessListsResponse> {
    return this.api.getCharacterAccessLists(characterId);
  }
}
