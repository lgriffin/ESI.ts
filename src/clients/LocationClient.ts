import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { locationEndpoints } from '../core/endpoints/locationEndpoints';
import {
  CharacterLocation,
  CharacterOnline,
  CharacterShip,
} from '../types/api-responses';

/**
 * A legacy domain client over the hand-written endpoint map.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. Use `createEsi()` from
 * `@lgriffin/esi.ts/client`: `esi.public` for public routes and
 * `esi.as(identity)` for authenticated ones. guides/LEGACY-REMOVAL.md
 * lists every legacy surface, its replacement and the open parity gaps.
 */
export class LocationClient extends BaseEsiClient<typeof locationEndpoints> {
  constructor(client: ApiClient) {
    super(client, locationEndpoints);
  }

  /**
   * Retrieves the current solar system, station, and structure location of a character.
   *
   * @param characterId - The ID of the character to locate
   * @returns The character's current location including solar system and optional station or structure
   * @requires Authentication
   */
  getCharacterLocation(characterId: number): Promise<CharacterLocation> {
    return this.api.getCharacterLocation(characterId);
  }

  /**
   * Checks whether a character is currently online and retrieves login/logout timestamps.
   *
   * @param characterId - The ID of the character to check
   * @returns The character's online status and last login/logout times
   * @requires Authentication
   */
  getCharacterOnline(characterId: number): Promise<CharacterOnline> {
    return this.api.getCharacterOnline(characterId);
  }

  /**
   * Retrieves the type, name, and item ID of the ship a character is currently flying.
   *
   * @param characterId - The ID of the character whose ship to retrieve
   * @returns The character's current ship details including type ID and ship name
   * @requires Authentication
   */
  getCharacterShip(characterId: number): Promise<CharacterShip> {
    return this.api.getCharacterShip(characterId);
  }
}
