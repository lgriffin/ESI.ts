import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { cosmeticsEndpoints } from '../core/endpoints/cosmeticsEndpoints';
import {
  CharacterSkinr,
  CharacterSkinrComponents,
  Skinr,
} from '../types/api-responses';

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
