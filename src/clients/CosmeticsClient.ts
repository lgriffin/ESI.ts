import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { cosmeticsEndpoints } from '../core/endpoints/cosmeticsEndpoints';
import {
  CharacterSkinr,
  CharacterSkinrComponents,
  Skinr,
} from '../types/api-responses';

/**
 * A legacy domain client over the hand-written endpoint map.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. Use `createEsi()` from
 * `@lgriffin/esi.ts/client`: `esi.public` for public routes and
 * `esi.as(identity)` for authenticated ones. guides/LEGACY-REMOVAL.md
 * lists every legacy surface, its replacement and the open parity gaps.
 */
export class CosmeticsClient extends BaseEsiClient<typeof cosmeticsEndpoints> {
  constructor(client: ApiClient) {
    super(client, cosmeticsEndpoints);
  }

  getCharacterSkinr(characterId: number): Promise<CharacterSkinr> {
    return this.api.getCharacterSkinr(characterId);
  }

  getCharacterSkinrComponents(
    characterId: number,
  ): Promise<CharacterSkinrComponents> {
    return this.api.getCharacterSkinrComponents(characterId);
  }

  getSkinr(skinrId: string): Promise<Skinr> {
    return this.api.getSkinr(skinrId);
  }
}
