import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetJumpFatigueApi {
    constructor(private client: ApiClient) {}

    async getJumpFatigue(characterId: number): Promise<object> {
        return await handleRequest(this.client, `characters/${characterId}/fatigue/`);
    }
}
