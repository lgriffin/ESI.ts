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
   * @param accessListId - The ID of the access list to retrieve
   * @returns The access list with its entries
   */
  getAccessList(accessListId: number): Promise<AccessList> {
    return this.api.getAccessList(accessListId) as Promise<AccessList>;
  }
}
