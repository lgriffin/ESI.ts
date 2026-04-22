import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { locationEndpoints } from '../core/endpoints/locationEndpoints';
import {
  CharacterLocation,
  CharacterOnline,
  CharacterShip,
} from '../types/api-responses';

export class LocationClient {
  private api: ReturnType<typeof createClient<typeof locationEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<typeof createClient<typeof locationEndpoints>>;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, locationEndpoints);
  }

  /**
   * Retrieves the current solar system, station, and structure location of a character.
   *
   * @param characterId - The ID of the character to locate
   * @returns The character's current location including solar system and optional station or structure
   * @requires Authentication
   */
  getCharacterLocation(characterId: number): Promise<CharacterLocation> {
    return this.api.getCharacterLocation(
      characterId,
    ) as Promise<CharacterLocation>;
  }

  /**
   * Checks whether a character is currently online and retrieves login/logout timestamps.
   *
   * @param characterId - The ID of the character to check
   * @returns The character's online status and last login/logout times
   * @requires Authentication
   */
  getCharacterOnline(characterId: number): Promise<CharacterOnline> {
    return this.api.getCharacterOnline(characterId) as Promise<CharacterOnline>;
  }

  /**
   * Retrieves the type, name, and item ID of the ship a character is currently flying.
   *
   * @param characterId - The ID of the character whose ship to retrieve
   * @returns The character's current ship details including type ID and ship name
   * @requires Authentication
   */
  getCharacterShip(characterId: number): Promise<CharacterShip> {
    return this.api.getCharacterShip(characterId) as Promise<CharacterShip>;
  }

  withMetadata(): WithMetadata<Omit<LocationClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, locationEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<LocationClient, 'withMetadata'>
    >;
  }
}
