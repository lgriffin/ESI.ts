import { ApiClient } from '../core/ApiClient';
import { GetCharacterAttributesApi } from '../api/skills/getCharacterAttributes';
import { GetCharacterSkillQueueApi } from '../api/skills/getCharacterSkillQueue';
import { GetCharacterSkillsApi } from '../api/skills/getCharacterSkills';

export class CharacterSkillsClient {
    private getCharacterAttributesApi: GetCharacterAttributesApi;
    private getCharacterSkillQueueApi: GetCharacterSkillQueueApi;
    private getCharacterSkillsApi: GetCharacterSkillsApi;

    constructor(client: ApiClient) {
        this.getCharacterAttributesApi = new GetCharacterAttributesApi(client);
        this.getCharacterSkillQueueApi = new GetCharacterSkillQueueApi(client);
        this.getCharacterSkillsApi = new GetCharacterSkillsApi(client);
    }

    async getCharacterAttributes(characterId: number): Promise<any> {
        return await this.getCharacterAttributesApi.getCharacterAttributes(characterId);
    }

    async getCharacterSkillQueue(characterId: number): Promise<any> {
        return await this.getCharacterSkillQueueApi.getCharacterSkillQueue(characterId);
    }

    async getCharacterSkills(characterId: number): Promise<any> {
        return await this.getCharacterSkillsApi.getCharacterSkills(characterId);
    }
}
