import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { cloneEndpoints } from '../core/endpoints/cloneEndpoints';
import { CloneInfo } from '../types/api-responses';

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
    return this.api.getClones(characterId) as Promise<CloneInfo>;
  }

  /**
   * Retrieve the implants currently installed in a character's active clone.
   *
   * @param characterId - The ID of the character whose implants to retrieve
   * @returns An array of type IDs for the currently installed implants
   * @requires Authentication
   */
  getImplants(characterId: number): Promise<number[]> {
    return this.api.getImplants(characterId) as Promise<number[]>;
  }
}
