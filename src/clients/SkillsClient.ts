import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { skillEndpoints } from '../core/endpoints/skillEndpoints';
import { CharacterAttributes, CharacterSkill, SkillQueue } from '../types/api-responses';

export class CharacterSkillsClient {
    private api: ReturnType<typeof createClient<typeof skillEndpoints>>;
    private _client: ApiClient;
    private _metaApi?: ReturnType<typeof createClient<typeof skillEndpoints>>;

    constructor(client: ApiClient) {
        this._client = client;
        this.api = createClient(client, skillEndpoints);
    }

    /**
     * Retrieves a character's neural remap attribute values (intelligence, memory, charisma, perception, willpower).
     *
     * @param characterId - The ID of the character
     * @returns The character's current attribute values and bonus remap information
     * @requires Authentication
     */
    async getCharacterAttributes(characterId: number): Promise<CharacterAttributes> {
        return this.api.getCharacterAttributes(characterId);
    }

    /**
     * Retrieves the skill training queue for a character.
     *
     * @param characterId - The ID of the character
     * @returns An ordered list of skills currently in the character's training queue
     * @requires Authentication
     */
    async getCharacterSkillQueue(characterId: number): Promise<SkillQueue[]> {
        return this.api.getCharacterSkillQueue(characterId);
    }

    /**
     * Retrieves all trained skills for a character, including total and unallocated skill points.
     *
     * @param characterId - The ID of the character
     * @returns The character's trained skills, total SP, and optionally unallocated SP
     * @requires Authentication
     */
    async getCharacterSkills(characterId: number): Promise<{ skills: CharacterSkill[]; total_sp: number; unallocated_sp?: number }> {
        return this.api.getCharacterSkills(characterId);
    }

    withMetadata(): WithMetadata<Omit<CharacterSkillsClient, 'withMetadata'>> {
        if (!this._metaApi) {
            this._metaApi = createClient(this._client, skillEndpoints, { returnMetadata: true });
        }
        return this._metaApi as unknown as WithMetadata<Omit<CharacterSkillsClient, 'withMetadata'>>;
    }
}
