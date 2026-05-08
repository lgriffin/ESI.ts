import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { skillEndpoints } from '../core/endpoints/skillEndpoints';
import {
  CharacterAttributes,
  CharacterSkill,
  SkillQueue,
} from '../types/api-responses';

export class CharacterSkillsClient extends BaseEsiClient<
  typeof skillEndpoints
> {
  constructor(client: ApiClient) {
    super(client, skillEndpoints);
  }

  /**
   * Retrieves a character's neural remap attribute values (intelligence, memory, charisma, perception, willpower).
   *
   * @param characterId - The ID of the character
   * @returns The character's current attribute values and bonus remap information
   * @requires Authentication
   */
  getCharacterAttributes(characterId: number): Promise<CharacterAttributes> {
    return this.api.getCharacterAttributes(
      characterId,
    ) as Promise<CharacterAttributes>;
  }

  /**
   * Retrieves the skill training queue for a character.
   *
   * @param characterId - The ID of the character
   * @returns An ordered list of skills currently in the character's training queue
   * @requires Authentication
   */
  getCharacterSkillQueue(characterId: number): Promise<SkillQueue[]> {
    return this.api.getCharacterSkillQueue(characterId) as Promise<
      SkillQueue[]
    >;
  }

  /**
   * Retrieves all trained skills for a character, including total and unallocated skill points.
   *
   * @param characterId - The ID of the character
   * @returns The character's trained skills, total SP, and optionally unallocated SP
   * @requires Authentication
   */
  getCharacterSkills(characterId: number): Promise<{
    skills: CharacterSkill[];
    total_sp: number;
    unallocated_sp?: number;
  }> {
    return this.api.getCharacterSkills(characterId) as Promise<{
      skills: CharacterSkill[];
      total_sp: number;
      unallocated_sp?: number;
    }>;
  }
}
