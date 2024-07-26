import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterSkillQueueApi {
    constructor(private client: ApiClient) {}

    async getCharacterSkillQueue(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/skillqueue`);
    }
}
