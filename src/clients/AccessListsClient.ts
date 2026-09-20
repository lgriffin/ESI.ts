import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { accessListEndpoints } from '../core/endpoints/accessListEndpoints';
import { AccessList } from '../types/api-responses';

export class AccessListsClient extends BaseEsiClient<
  typeof accessListEndpoints
> {
  constructor(client: ApiClient) {
    super(client, accessListEndpoints);
  }

  /**
   * Retrieves the contents of an access list (ACL) including all character, corporation, and alliance entries.
   *
   * @param characterId - The ID of the character who owns the access list
   * @param accessListId - The ID of the access list to retrieve
   * @returns The access list with its entries
   * @requires Authentication
   */
  getAccessList(
    characterId: number,
    accessListId: number,
  ): Promise<AccessList> {
    return this.api.getAccessList(characterId, accessListId);
  }

  /**
   * Retrieves all access lists for a character.
   *
   * @param characterId - The ID of the character
   * @returns An array of the character's access lists
   * @requires Authentication
   */
  getCharacterAccessLists(characterId: number): Promise<AccessList[]> {
    return this.api.getCharacterAccessLists(characterId);
  }
}
