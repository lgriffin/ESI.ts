import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { cloneEndpoints } from '../core/endpoints/cloneEndpoints';
import { CloneInfo } from '../types/api-responses';

export class ClonesClient {
  private api: ReturnType<typeof createClient<typeof cloneEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<typeof createClient<typeof cloneEndpoints>>;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, cloneEndpoints);
  }

  /**
   * Retrieve a character's clone state, including home station and available jump clones.
   *
   * @param characterId - The ID of the character whose clone information to retrieve
   * @returns Clone information including home location and jump clone details
   * @requires Authentication
   */
  async getClones(characterId: number): Promise<CloneInfo> {
    return this.api.getClones(characterId);
  }

  /**
   * Retrieve the implants currently installed in a character's active clone.
   *
   * @param characterId - The ID of the character whose implants to retrieve
   * @returns An array of type IDs for the currently installed implants
   * @requires Authentication
   */
  async getImplants(characterId: number): Promise<number[]> {
    return this.api.getImplants(characterId);
  }

  withMetadata(): WithMetadata<Omit<ClonesClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, cloneEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<ClonesClient, 'withMetadata'>
    >;
  }
}
