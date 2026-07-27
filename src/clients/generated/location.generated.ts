 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { locationEndpoints } from '../../core/endpoints/locationEndpoints';
import { CharacterLocationSchema, CharacterOnlineSchema, CharacterShipSchema } from '../../schemas/location';

export class GeneratedLocationClient extends BaseEsiClient<typeof locationEndpoints> {
  constructor(client: ApiClient) {
    super(client, locationEndpoints);
  }

  /**
   * GET getCharacterLocation
   * @requires Authentication
   */
  getCharacterLocation(characterId: number | string): Promise<z.infer<typeof CharacterLocationSchema>> {
    return this.api.getCharacterLocation(characterId) as Promise<z.infer<typeof CharacterLocationSchema>>;
  }

  /**
   * GET getCharacterOnline
   * @requires Authentication
   */
  getCharacterOnline(characterId: number | string): Promise<z.infer<typeof CharacterOnlineSchema>> {
    return this.api.getCharacterOnline(characterId) as Promise<z.infer<typeof CharacterOnlineSchema>>;
  }

  /**
   * GET getCharacterShip
   * @requires Authentication
   */
  getCharacterShip(characterId: number | string): Promise<z.infer<typeof CharacterShipSchema>> {
    return this.api.getCharacterShip(characterId) as Promise<z.infer<typeof CharacterShipSchema>>;
  }
}
