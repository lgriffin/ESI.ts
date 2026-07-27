 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { skillEndpoints } from '../../core/endpoints/skillEndpoints';
import { CharacterAttributesSchema } from '../../schemas/character';
import { CharacterSkillsResponseSchema, SkillQueueSchema } from '../../schemas/skills';

export class GeneratedSkillClient extends BaseEsiClient<typeof skillEndpoints> {
  constructor(client: ApiClient) {
    super(client, skillEndpoints);
  }

  /**
   * GET getCharacterAttributes
   * @requires Authentication
   */
  getCharacterAttributes(characterId: number | string): Promise<z.infer<typeof CharacterAttributesSchema>> {
    return this.api.getCharacterAttributes(characterId) as Promise<z.infer<typeof CharacterAttributesSchema>>;
  }

  /**
   * GET getCharacterSkillQueue
   * @requires Authentication
   */
  getCharacterSkillQueue(characterId: number | string): Promise<(z.infer<typeof SkillQueueSchema>)[]> {
    return this.api.getCharacterSkillQueue(characterId) as Promise<(z.infer<typeof SkillQueueSchema>)[]>;
  }

  /**
   * GET getCharacterSkills
   * @requires Authentication
   */
  getCharacterSkills(characterId: number | string): Promise<z.infer<typeof CharacterSkillsResponseSchema>> {
    return this.api.getCharacterSkills(characterId) as Promise<z.infer<typeof CharacterSkillsResponseSchema>>;
  }
}
