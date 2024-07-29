import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterSkillsApi {
    constructor(private client: ApiClient) {}

    async getCharacterSkills(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/skills`, 'GET', undefined, true);
    }
}
