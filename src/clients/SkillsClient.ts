import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { skillEndpoints } from '../core/endpoints/skillEndpoints';
import { CharacterAttributes, CharacterSkill, SkillQueue } from '../types/api-responses';

export class CharacterSkillsClient {
    private api: ReturnType<typeof createClient<typeof skillEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, skillEndpoints);
    }

    async getCharacterAttributes(characterId: number): Promise<CharacterAttributes> {
        return this.api.getCharacterAttributes(characterId);
    }

    async getCharacterSkillQueue(characterId: number): Promise<SkillQueue[]> {
        return this.api.getCharacterSkillQueue(characterId);
    }

    async getCharacterSkills(characterId: number): Promise<{ skills: CharacterSkill[]; total_sp: number; unallocated_sp?: number }> {
        return this.api.getCharacterSkills(characterId);
    }
}
